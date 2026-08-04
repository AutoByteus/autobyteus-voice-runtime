#!/bin/sh
set -eu
/bin/sync
/usr/bin/sudo -n /usr/sbin/purge >/dev/null
printf '%s\n' 'autobyteus-filesystem-cold-v1'
