#!/bin/bash

# Example crontab:
#
# */14 *  * * * /root/spacetrack_tle.sh /srv/principia/iss.txt
#

output_file=$1
USER=''
PASSWORD=''

if [ -z "$output_file" ]; then
  echo "Usage: ./spacetrack_tle <output_file>";
  exit;
fi
wget -q --post-data="identity=${USER}&password=${PASSWORD}&query=https://www.space-track.org/basicspacedata/query/class/tle_latest/NORAD_CAT_ID/25544/ORDINAL/1/EPOCH/%3Enow-30/format/3le" --cookies=on --keep-session-cookies --save-cookies=cookies.txt 'https://www.space-track.org/ajaxauth/login' -O /tmp/spacetrack-iss.txt;
if [ $? == 0 ]; then
 sed -i 's/0 ISS (ZARYA)/ISS (ZARYA)/' /tmp/spacetrack-iss.txt
 mv -f /tmp/spacetrack-iss.txt $output_file;
fi
