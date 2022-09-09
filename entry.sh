#/bin/bash
# openssl req -new -newkey rsa:4096 -days 365 -nodes -x509 \
#     -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=localhost" \
#     -keyout /etc/ssl/certs/localhost.key  -out /etc/ssl/certs/localhost.cert
# openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048
nginx
# npm run dev
tail -f /dev/null