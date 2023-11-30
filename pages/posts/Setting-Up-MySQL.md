---
title: Setting Up MySQL and phpMyAdmin in Debian with Docker🐳
date: 2023/11/30
description: Discover a hassle-free way to manage MySQL databases using Docker containers on your Debian OS. This step-by-step guide walks you through setting up a MySQL container, connecting it to a phpMyAdmin container, all within the Docker environment.
tag: containerization, docker, mysql, phpmyadmin
author: mayura andrew
---

# Setting Up MySQL and phpMyAdmin in Debian with Docker 🐳
--- 

![Docker](public/images/docker.png)

## Introduction 🚀

This guide provides step-by-step instructions on running a MySQL container in Debian OS and connecting it to a phpMyAdmin container, both running within Docker. This allows you to manage your MySQL databases seamlessly.

#### My OS

![MyOS](public/images/os.png)


### Part 1: MySQL Container Setup

####  Pull MySQL Docker Image:


```bash
docker pull container-registry.oracle.com/mysql/community-server:tag
```
Replace 'tag' with the desired version of MySQL, such as 'latest' for the latest version.

#### Run MySQL Container:

```bash
docker run --name mysql-container -d -p 3306:3306 --env MYSQL_ROOT_PASSWORD=my-secret-pw mysql:tag
```

Replace 'tag' with the version of MySQL you pulled in the previous step. Ensure consistency in container names and port mappings.

### Part 2: phpMyAdmin Container Setup

#### Create a Docker Network:

```bash
docker network create my-network
```

#### Run MySQL Container with Network:

```bash
docker run -d --name mysql-container --network my-network -e MYSQL_ROOT_PASSWORD=your_mysql_root_password mysql:tag
```

Replace 'tag' with the version of MySQL you want to use, e.g., 'latest'.

#### Run phpMyAdmin Container:

```bash
docker run -d --name phpmyadmin-container --network my-network -e PMA_HOST=mysql-container -p 8080:80 phpmyadmin/phpmyadmin
```

This command links phpMyAdmin to the MySQL container and exposes port 8080 on the host.

#### Access phpMyAdmin:

Visit http://localhost:8080 in your web browser. Log in using the MySQL root username and password.

### Conclusion 🎉

You've successfully set up a MySQL container and connected it to phpMyAdmin in a Dockerized environment on Debian. Enjoy managing your MySQL databases with ease!

### Sources 📚
- [MySQL Docker Image: Docker Hub - MySQL](https://hub.docker.com/_/mysql)
- [phpMyAdmin Docker Image: Docker Hub - phpMyAdmin](https://hub.docker.com/_/phpmyadmin)

---
