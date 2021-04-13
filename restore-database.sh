#!/bin/bash

# Roda servidor mongo local e restaura
docker run --name jude-mongo -p 27017:27017 -v $PWD:/tmp -d mongo:3.6
# Aguarda servidor mongo iniciar
until [ $(docker logs --tail all jude-mongo | grep "waiting for connections on port" | wc -l) -gt 0 ]; do
    printf '.'
    sleep 0.5
done
docker exec jude-mongo mongorestore --drop --gzip --archive=/tmp/bocamongo.gz
