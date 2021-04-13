# Detectando plágio

## JPlag

		java -jar tools/jplag-2.12.1-SNAPSHOT-jar-with-dependencies.jar -s -l c/c++ out/\[Expressões\ aritméticas\]\ Energia\ para\ transmutação
		open result/index.html

## Sherlock

ou com o sherlock - <https://github.com/diogocabral/sherlock>

		../../../tools/sherlock/sherlock -z 3 -t 50% -r -e cpp . | sort -t ';' -k 3 -n | sed -e 's/;/ /g' | sed -e 's/\.\///g' | sed -e 's/ /\t/g'

## Como investigar

- Geralmente um aluno copia de um outro aluno específico. Então se A copiou de B em uma questão, em outra questão ele provavelmente também vai copiar do aluno B, e não do aluno C.
- Olhar o histórico de submissões pode ser útil. Se A e B são suspeitos de plágio, e um deles acertou de primeira e o outro não, isso é suspeito
- Outra característica promissora é olhar para erros de grafia ou espaçamento esquisito (ex.: desvio em relação ao que dita um guia de estilo)

# Fazendo dump com SSH

Primeiramente, você deve adicionar uma chave pública de seu computador ao servidor do JUDE, de forma a realizar SSH sem senha. Você deve utilizar um usuário no servidor com permissão de rodar o comando `sudo` sem senha.

A seguir, basta executar o script `download-database.sh`.
