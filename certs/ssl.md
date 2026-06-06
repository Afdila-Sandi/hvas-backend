openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout hvas.key \
  -out hvas.crt \
  -subj "/CN= ip publik server "