FROM node:16
RUN apt update && apt install -y nginx
WORKDIR /usr/src/app
COPY .git /usr/src/app/.git
COPY scripts /usr/src/app/scripts
COPY package*.json /usr/src/app
RUN npm install
RUN openssl req -new -newkey rsa:4096 -days 365 -nodes -x509 \
    -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=localhost" \
    -keyout /etc/ssl/certs/localhost.key  -out /etc/ssl/certs/localhost.cert
RUN openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048

COPY . /usr/src/app/

COPY nginx/default /etc/nginx/sites-available/default
COPY nginx/ssl.conf /etc/nginx/snippets/ssl.conf
COPY nginx/ssl-params.conf /etc/nginx/snippets/ssl-params.conf

ENTRYPOINT [ "/bin/bash", "entry.sh" ]