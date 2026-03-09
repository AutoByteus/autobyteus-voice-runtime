#!/usr/bin/env python3
import os
import runpy
import socket


_ORIGINAL_GETADDRINFO = socket.getaddrinfo


def _ipv4_only_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    if family == socket.AF_UNSPEC:
        family = socket.AF_INET
    return _ORIGINAL_GETADDRINFO(host, port, family, type, proto, flags)


socket.getaddrinfo = _ipv4_only_getaddrinfo
os.environ.setdefault("PIP_DISABLE_PIP_VERSION_CHECK", "1")
runpy.run_module("pip", run_name="__main__")
