//go:build windows

package launcher

import (
	"os"
	"os/exec"
	"os/signal"
	"syscall"
	"unsafe"
)

const (
	createNewProcessGroup           = 0x00000200
	createSuspended                 = 0x00000004
	jobObjectExtendedLimitInfoClass = 9
	jobObjectLimitKillOnJobClose    = 0x00002000
	jobAssignableProcessAccess      = 0x00000901
)

type jobObjectBasicLimitInformation struct {
	PerProcessUserTimeLimit, PerJobUserTimeLimit int64
	LimitFlags                                   uint32
	MinimumWorkingSetSize, MaximumWorkingSetSize uintptr
	ActiveProcessLimit                           uint32
	Affinity                                     uintptr
	PriorityClass, SchedulingClass               uint32
}
type ioCounters struct{ ReadOperationCount, WriteOperationCount, OtherOperationCount, ReadTransferCount, WriteTransferCount, OtherTransferCount uint64 }
type jobObjectExtendedLimitInformation struct {
	BasicLimitInformation                                                        jobObjectBasicLimitInformation
	IoInfo                                                                       ioCounters
	ProcessMemoryLimit, JobMemoryLimit, PeakProcessMemoryUsed, PeakJobMemoryUsed uintptr
}

var kernel32 = syscall.NewLazyDLL("kernel32.dll")
var createJobObjectW = kernel32.NewProc("CreateJobObjectW")
var setInformationJobObject = kernel32.NewProc("SetInformationJobObject")
var assignProcessToJobObject = kernel32.NewProc("AssignProcessToJobObject")
var generateConsoleCtrlEvent = kernel32.NewProc("GenerateConsoleCtrlEvent")
var ntResumeProcess = syscall.NewLazyDLL("ntdll.dll").NewProc("NtResumeProcess")

func executePrivate(executable string, args, environment []string, scratch string) (int, bool) {
	job, _, _ := createJobObjectW.Call(0, 0)
	if job == 0 {
		return 0, false
	}
	defer syscall.CloseHandle(syscall.Handle(job))
	limits := jobObjectExtendedLimitInformation{}
	limits.BasicLimitInformation.LimitFlags = jobObjectLimitKillOnJobClose
	ok, _, _ := setInformationJobObject.Call(job, jobObjectExtendedLimitInfoClass, uintptr(unsafe.Pointer(&limits)), unsafe.Sizeof(limits))
	if ok == 0 {
		return 0, false
	}
	command := exec.Command(executable, args[1:]...)
	command.Env = environment
	command.Stdin, command.Stdout, command.Stderr = os.Stdin, os.Stdout, os.Stderr
	command.SysProcAttr = &syscall.SysProcAttr{CreationFlags: createNewProcessGroup | createSuspended, HideWindow: false}
	if command.Start() != nil {
		return 0, false
	}
	processHandle, openErr := syscall.OpenProcess(jobAssignableProcessAccess, false, uint32(command.Process.Pid))
	if openErr != nil {
		_ = command.Process.Kill()
		_ = command.Wait()
		return 0, false
	}
	defer syscall.CloseHandle(processHandle)
	assigned, _, _ := assignProcessToJobObject.Call(job, uintptr(processHandle))
	if assigned == 0 {
		_ = command.Process.Kill()
		_ = command.Wait()
		return 0, false
	}
	status, _, _ := ntResumeProcess.Call(uintptr(processHandle))
	if status != 0 {
		_ = command.Process.Kill()
		_ = command.Wait()
		return 0, false
	}
	interrupts := make(chan os.Signal, 1)
	signal.Notify(interrupts, os.Interrupt)
	done := make(chan struct{})
	go func() {
		select {
		case <-interrupts:
			generateConsoleCtrlEvent.Call(1, uintptr(command.Process.Pid))
		case <-done:
		}
	}()
	err := command.Wait()
	close(done)
	signal.Stop(interrupts)
	_ = os.RemoveAll(scratch)
	if err == nil {
		return 0, true
	}
	if exit, ok := err.(*exec.ExitError); ok {
		return exit.ExitCode(), true
	}
	return 0, false
}
