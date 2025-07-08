# 积分对战平台部署指南

本文档将指导您如何将"积分对战平台"项目部署到一台全新的服务器上。本指南假设您对 Linux 命令行有基本了解，但没有复杂的部署经验。

## 技术栈与部署方案

-   **前端**: React + TypeScript (Vite)
-   **后端**: Node.js + Express + TypeScript
-   **数据库**: MySQL
-   **缓存**: Redis
-   **部署方案**: Docker + Docker Compose

我们将使用 Docker 将前端、后端、数据库和缓存分别打包成独立的容器，然后使用 Docker Compose 一键启动和管理所有服务。这种方式可以极大地简化部署流程并保证环境的一致性。

---

## 步骤 1: 服务器准备

在开始之前，您需要准备以下资源：

1.  **一台云服务器**:
    *   拥有一个**公网 IP 地址**。
    *   推荐配置：**1核 CPU / 2GB 内存** 或更高。
    *   推荐操作系统：**Ubuntu 20.04 / 22.04** 或 CentOS 7+。
    *   确保您的服务器提供商的**安全组**（或防火墙）规则开放了以下端口：
        *   **22 (SSH)**: 用于远程登录服务器。
        *   **80 (HTTP)**: 用于用户通过浏览器访问您的网站。
        *   **443 (HTTPS)**: （可选）如果您后续配置了 SSL 证书，则需要此端口。

2.  **安装 Git**: 用于从代码仓库拉取项目代码。
    ```bash
    # 在 Ubuntu 上执行
    sudo apt update
    sudo apt install git -y
    ```

3.  **安装 Docker**: 用于运行容器。
    ```bash
    # 下载官方安装脚本
    curl -fsSL https://get.docker.com -o get-docker.sh
    # 执行安装脚本
    sudo sh get-docker.sh
    # 将当前用户添加到 docker 组，这样执行 docker 命令时就不需要 sudo
    sudo usermod -aG docker $USER
    # 退出并重新登录服务器以使用户组生效
    exit 
    ```
    重新登录后，运行 `docker --version` 检查是否安装成功。

4.  **安装 Docker Compose**: 用于编排和管理多个 Docker 容器。
    ```bash
    # 从 GitHub 下载 Docker Compose 最新版本
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    # 赋予执行权限
    sudo chmod +x /usr/local/bin/docker-compose
    ```
    运行 `docker-compose --version` 检查是否安装成功。

---

## 步骤 2: 获取并配置项目

1.  **克隆项目代码**
    使用 Git 将项目代码克隆到您的服务器上。建议放在 `/home/<your_user>/` 或 `/var/www/` 目录下。
    ```bash
    # 替换下面的 URL 为您的项目仓库地址
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **配置后端环境变量**
    后端服务的配置（如数据库密码、JWT 密钥等）是通过环境变量管理的。

    *   首先，进入 `backend` 目录，复制环境变量模板文件。
        ```bash
        cd backend
        cp env.example .env
        ```
    *   然后，编辑新创建的 `.env` 文件。
        ```bash
        nano .env
        ```
    *   在编辑器中，您需要**重点修改**以下配置：

        | 变量名          | 说明                                                                                                                              | 示例/建议值                                           |
        | ---------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
        | `DATABASE_URL`   | 数据库连接字符串。**保持 `mysql:3306` 不变**，因为 `mysql` 是 Docker Compose 网络中的服务名，Docker 会自动解析。 | `mysql://battle_user:battle_pass@mysql:3306/battle_arena` |
        | `REDIS_URL`      | Redis 连接字符串。**保持 `redis:6379` 不变**。                                                                                       | `redis://redis:6379`                                  |
        | `JWT_SECRET`     | **（必须修改）** 用于生成和验证用户登录 Token 的密钥。请务必修改为一个**复杂且随机的长字符串**，以保证安全。 | `a-very-long-random-and-secret-string-12345`          |
        | `ADMIN_USERNAME` | 默认创建的管理员账户的用户名。                                                                                                    | `admin`                                               |
        | `ADMIN_PASSWORD` | 默认创建的管理员账户的密码。                                                                                                      | `admin123` （建议修改为更复杂的密码）                    |
        | `ADMIN_EMAIL`    | 默认创建的管理员账户的邮箱。                                                                                                      | `admin@example.com`                                   |

    *   修改完成后，按 `Ctrl+X`，然后按 `Y` 保存，最后按 `Enter` 确认退出 `nano` 编辑器。
    *   返回项目根目录。
        ```bash
        cd .. 
        ```

---

## 步骤 3: 构建与启动

现在，所有配置都已完成，我们可以使用 Docker Compose 一键构建和启动所有服务。

1.  **执行构建和启动命令**
    在项目根目录（即 `docker-compose.yml` 文件所在的目录）下，运行以下命令：
    ```bash
    docker-compose up -d --build
    ```
    *   `up`: 创建并启动容器。
    *   `-d`: 后台模式（Detached mode），容器将在后台持续运行。
    *   `--build`: 强制重新构建镜像。首次部署或更新代码后，都需要使用此参数。

    这个过程会需要一些时间，因为它需要下载基础镜像、安装依赖、编译代码等。

2.  **验证容器状态**
    等待命令执行完毕后，可以查看所有容器的运行状态：
    ```bash
    docker-compose ps
    ```
    您应该能看到类似下面的输出，并且所有服务的 `State` 都应为 `Up`：
    ```
           Name                         Command               State           Ports
    ---------------------------------------------------------------------------------------
    battle-arena-backend     docker-entrypoint.sh npm start   Up      0.0.0.0:3001->3001/tcp
    battle-arena-frontend    /docker-entrypoint.sh ngin ...   Up      0.0.0.0:80->80/tcp
    battle-arena-mysql       docker-entrypoint.sh mysqld      Up      0.0.0.0:3306->3306/tcp
    battle-arena-redis       docker-entrypoint.sh redis ...   Up      0.0.0.0:6379->6379/tcp
    ```

---

## 步骤 4: 数据库迁移

容器首次启动时，数据库是空的。我们需要运行 Prisma 的迁移命令来创建所有的数据表。

1.  **执行数据库迁移**
    ```bash
    docker-compose exec backend npx prisma migrate deploy
    ```
    *   `docker-compose exec backend`: 表示在名为 `backend` 的容器内执行后面的命令。
    *   `npx prisma migrate deploy`: 这是 Prisma 官方推荐的在生产环境中应用数据库表结构的命令。

2.  **验证管理员账户创建**
    迁移成功后，后端服务会自动创建您在 `.env` 文件中配置的管理员账户。您可以查看后端日志来确认：
    ```bash
    docker-compose logs backend
    ```
    如果看到 `✅ 管理员账户已存在或创建成功` 的日志，说明一切正常。

---

## 步骤 5: 访问您的网站

恭喜！所有服务都已成功部署。

现在，打开您的浏览器，输入服务器的公网 IP 地址 `http://<您的服务器公网IP>`，您应该就能看到"积分对战平台"的登录页面了。您可以使用配置的管理员账户登录并开始使用。

---

## 日常运维

### 更新项目代码

1.  在服务器的项目根目录下，拉取最新的代码：
    ```bash
    git pull origin main  # 或者您的主分支名
    ```
2.  重新构建并启动服务，以应用代码变更：
    ```bash
    docker-compose up -d --build
    ```

### 查看日志

-   查看所有服务的日志：
    ```bash
    docker-compose logs -f
    ```
-   只查看特定服务的日志（例如后端）：
    ```bash
    docker-compose logs -f backend
    ```
    (`-f` 参数表示持续跟踪新日志)

### 停止服务

```bash
# 停止并移除所有容器、网络
docker-compose down
```

### 进入容器进行调试

如果您需要进入某个容器的命令行进行调试（例如查看文件、手动执行脚本），可以使用 `exec` 命令：
```bash
# 进入后端容器的 bash
docker-compose exec backend bash
```

---

部署完成！祝您使用愉快。如有任何问题，请根据日志进行排查或联系开发人员。 