#!/bin/bash

docker rm jude-mongo
docker run --tty --name jude-mongo -p 27017:27017 -v $PWD:/tmp -d mongo:3.6