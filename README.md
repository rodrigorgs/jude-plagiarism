# Detectando plágio

## JPlag

		java -jar tools/jplag-2.12.1-SNAPSHOT-jar-with-dependencies.jar -s -l c/c++ out/\[Expressões\ aritméticas\]\ Energia\ para\ transmutação
		open result/index.html

## Sherlock

ou com o sherlock - <https://github.com/diogocabral/sherlock>

		../../../tools/sherlock/sherlock -z 3 -t 50% -r -e cpp . | sort -t ';' -k 3 -n | sed -e 's/;/ /g' | sed -e 's/\.\///g

# Fazendo dump com SSH

(assumindo que já adicionou a chave pública ao servidor para fazer ssh sem senha)

```sh
# Faz dump e copia
ssh -p 2099 -t boca@200.128.51.30 "sudo docker exec -ti jude_db_1 mongodump --gzip --archive=/tmp/bocamongo.gz && sudo docker cp jude_db_1:/tmp/bocamongo.gz /tmp/"
scp -P 2099 boca@200.128.51.30:/tmp/bocamongo.gz .
ssh -p 2099 -t boca@200.128.51.30 "sudo docker exec -ti jude_db_1 rm -f /tmp/bocamongo.gz && sudo rm -f /tmp/bocamongo.gz"
# Roda servidor mongo local e restaura
docker run --name jude-mongo -p 27017:27017 -v $PWD:/tmp -it --rm -d mongo:3.6
docker exec -ti jude-mongo mongorestore --drop --gzip --archive=/tmp/bocamongo.gz
```

