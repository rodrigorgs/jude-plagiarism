#!/bin/bash

# Faz dump e copia
ssh -p 2099 -tt boca@200.128.51.30 "sudo docker exec -ti jude_db_1 mongodump --gzip --archive=/tmp/bocamongo.gz && sudo docker cp jude_db_1:/tmp/bocamongo.gz /tmp/"
scp -P 2099 boca@200.128.51.30:/tmp/bocamongo.gz .
ssh -p 2099 -tt boca@200.128.51.30 "sudo docker exec -ti jude_db_1 rm -f /tmp/bocamongo.gz && sudo rm -f /tmp/bocamongo.gz"
