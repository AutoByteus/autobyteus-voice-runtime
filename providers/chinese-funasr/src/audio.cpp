#include "audio.h"
#include <cmath>
#include <cstdint>
#include <cstring>
#include <fstream>
#include <stdexcept>
#include <vector>
namespace { uint16_t u16(const uint8_t*p){return p[0]|uint16_t(p[1])<<8;} uint32_t u32(const uint8_t*p){return p[0]|uint32_t(p[1])<<8|uint32_t(p[2])<<16|uint32_t(p[3])<<24;} }
ValidAudio read_valid_audio(const std::filesystem::path& path){
    if(!path.is_absolute()||!std::filesystem::is_regular_file(path)||std::filesystem::is_symlink(path))throw std::runtime_error("invalid-audio-path");
    std::ifstream input(path,std::ios::binary);std::vector<uint8_t> bytes((std::istreambuf_iterator<char>(input)),{});
    if(bytes.size()<44||memcmp(bytes.data(),"RIFF",4)||memcmp(bytes.data()+8,"WAVE",4)||u32(bytes.data()+4)+8!=bytes.size())throw std::runtime_error("invalid-wave");
    size_t offset=12;bool format=false;const uint8_t*data=nullptr;uint32_t data_size=0;
    while(offset+8<=bytes.size()){auto size=u32(bytes.data()+offset+4);auto body=offset+8;if(body+size>bytes.size())throw std::runtime_error("truncated-wave");std::string id(reinterpret_cast<char*>(bytes.data()+offset),4);if(id=="fmt "){if(size!=16||u16(bytes.data()+body)!=1||u16(bytes.data()+body+2)!=1||u32(bytes.data()+body+4)!=16000||u16(bytes.data()+body+14)!=16)throw std::runtime_error("invalid-wave-format");format=true;}else if(id=="data"){if(data)throw std::runtime_error("duplicate-wave-data");data=bytes.data()+body;data_size=size;}offset=body+size+(size&1);}
    if(offset!=bytes.size()||!format||!data||data_size%2)throw std::runtime_error("invalid-wave-structure");size_t count=data_size/2;if(count<2400||count>480000)throw std::runtime_error("invalid-wave-duration");
    ValidAudio result;result.samples.reserve(count);int peak=0;for(size_t i=0;i<count;i++){int16_t sample=int16_t(u16(data+2*i));peak=std::max(peak,std::abs(int(sample)));result.samples.push_back(sample/32768.0f);}result.duration_ms=int(count*1000/16000);result.no_speech=peak<=64;return result;
}
