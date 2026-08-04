#pragma once

#include <filesystem>
#include <string>

std::string sha256_bytes(const std::string &value);
std::string sha256_file_incremental_apple(const std::filesystem::path &path);
