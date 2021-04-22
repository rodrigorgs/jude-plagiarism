#!/bin/bash

# Roda servidor mongo local e restaura
echo "Will run 'docker run mongo'"
docker run --tty --name jude-mongo -p 27017:27017 -v $PWD:/tmp -d mongo:3.6
echo "Did run 'docker run mongo'"
docker ps -a
# Aguarda servidor mongo iniciar
echo "Waiting for MongoDB to accept connections"
TIMER=0
until docker exec --tty jude-mongo mongo --eval "db.serverStatus()"
do
  sleep 1
  echo "."
  TIMER=$((TIMER + 1))

  if [[ $TIMER -eq 20 ]]; then
    echo "MongoDB did not initialize within 20 seconds. Exiting."
    exit 2
  fi
done

# until [ $(docker logs --tail all jude-mongo | grep "waiting for connections on port" | wc -l) -gt 0 ]; do
#     printf '.'
#     sleep 0.5
# done
docker exec --tty jude-mongo mongorestore --drop --gzip --archive=/tmp/bocamongo.gz
