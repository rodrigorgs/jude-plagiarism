#!/bin/bash

# Faz dump e copia
ssh -p 2099 -tt boca@200.128.51.30 "sudo docker exec -ti jude_db_1 mongodump --gzip --archive=/tmp/bocamongo.gz && sudo docker cp jude_db_1:/tmp/bocamongo.gz /tmp/"
scp -P 2099 boca@200.128.51.30:/tmp/bocamongo.gz .
ssh -p 2099 -tt boca@200.128.51.30 "sudo docker exec -ti jude_db_1 rm -f /tmp/bocamongo.gz && sudo rm -f /tmp/bocamongo.gz"
# Roda servidor mongo local e restaura
docker run --name jude-mongo -p 27017:27017 -v $PWD:/tmp --rm -d mongo:3.6
docker exec jude-mongo mongorestore --drop --gzip --archive=/tmp/bocamongo.gz
