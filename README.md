## CLOUD NATIVE PLATFORM MONOREPO


### INITIAL SETUP
```shell
  npm run start:container
```


### CONNECT SSH CONFIG DOCKER CONTAINER OF DOKKU

- GENERATE SSH BARE METAL SERVER
```shell
    ssh-keygen -t rsa -b 4096 -C "dokku@server"
```

- Connect SSH

```shell
docker exec -it <id-container-dokku> bash
echo "ssh-rsa <Replace String Long Public Key SSH>" | dokku ssh-keys:add solusikonsep
```

### TROUBLESHOOTING

- CHECK CONFIG UPSTREAM APP

```shell
    dokku nginx:show-config <appname>
```

- GROUPING NETWORKING DEPLOYMENT

```shell
    docker create network <netname>
    dokku network:set --global initial-network devjam &&
    dokku network:set --global attach-post-create devjam &&
    dokku network:set --global attach-post-deploy devjam &&
```

- UPDATE TUNNEL CF

CREATE RECORD 
WILDCARD TYPE CNAME * VALUE <TunnelID>.cfargotunne.com PROXY true


### FINAL TEST
```shell
  npm run deploy:test
```
