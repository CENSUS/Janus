# Janus

Installation instructions for the Janus project

---

# Dependencies

| Operating System     |
| -------------------- |
| Ubuntu Focal (20.04) |

| Dependencies                    | Dependencies |
| ------------------------------- | ------------ |
| Kubernetes (MicroK8s) - v. 1.23 | NodeJS / NPM |
| Docker                          | jq           |
| Golang                          | Wine         |
| make                            | pwgen        |

| ABE Dependencies                                                                                             |
| ------------------------------------------------------------------------------------------------------------ |
| vault-secrets-abe-janus ([Download Link](https://github.com/CENSUS/vault-secrets-abe-janus "Download Link")) |

# Automatic Installation

Copy the following components inside the **same** folder (e.g. Project):

```
Project/Janus
Project/vault-secrets-abe-janus
```

The `initialize.sh` script of Janus accepts an optional argument [dependencies/project].

| Execute                              | Action                                                         |
| ------------------------------------ | -------------------------------------------------------------- |
| ./initialize.sh                      | Installs both the Dependencies and the Project                 |
| ./initialize.sh _install_essentials_ | Installs the OS's Dependencies (Step 1)                        |
| ./initialize.sh _project_images_     | Constructs the application's Images (Step 2)                   |
| ./initialize.sh _vault_image_        | Constructs the application's Hashicorp's Vault Image (Step 3)  |
| ./initialize.sh _configure_          | Automatically applies the application's configuration (Step 4) |
| ./initialize.sh _project_            | Starts the application (Step 5)                                |

The installation may require, approximately, ~20-30 minutes to complete (or more), depending on your system's capabilities.

In order to install the application, navigate to: `Project/Janus` and execute the `initialize.sh` script, without providing any arguments.

```
$ ./initialize.sh
```

After installing the OS's dependencies, your system will be automatically rebooted. Upon rebooting, rerun the installation script and it will automatically continue the installation process.

```
$ ./initialize.sh
```

If the installation fails to complete, you may first check the debug logs.
The Debug Logs can be found under:

> Janus/debug_logs

Then, you may continue the installation from where it failed, by passing the appropriate argument to the `initialize.sh` script. I.e. if it failed while trying to construct the Hashicorp's Vault Image, you can run:

```
$ ./initialize.sh vault_image
$ ./initialize.sh configure
$ ./initialize.sh project
```

Upon complete installation, the application will be ready for use.

# Access the Application

You may access the Application with the Client Application that you may acquire by navigating to: _https://api.`PUBLIC_IP`.nip.io_.

### Linux Client Application

If your system is based on Linux, download the Linux Client Application. Then, make the downloaded _moh-client.AppImage_ executable by executing:

> sudo chmod +x moh-client.AppImage

and execute the Client Application by executing:

> ./moh-client.AppImage

### Windows Client Application

If your system is based on Windows, just acquire the Windows Client Application executable and run it.

# Manual Installation

The whole installation procedure (Blockchains, Applications, CAs etc.) is **automated**.
However, there are some **dependencies** that must be installed on the server that the System will run on, as well as the Images used by the Pods, need to be generated.

# Dependencies Installation

## Crucial Packages

Prior to anything else, you need to install some crucial packages (build-essential, gcc, g++). Thus, execute:

```
$ sudo apt-get update
$ sudo apt-get install build-essential gcc g++ -y
```

## Kubernetes

**In order to install Kubernetes**, use the Official Installation Steps as described [here](https://microk8s.io/ "here"), or run:

```bash
 $ sudo snap install microk8s --classic --channel=1.23/stable
```

This command will install MicroK8s, version 1.23.
After the installation procedure, **create an alias for the kubectl**:

    sudo snap alias microk8s.kubectl kubectl

and **export the default _kubeconfig_**:

    kubectl config view --raw > ~/.kube/config

Now that Kubernetes is successfully installed on the Ubuntu System, there are some Kubernetes' addons (dependencies) that must be installed, as well.

---

#### Kubernetes' Dependencies (Addons)

- Storage - Creates a default storage class which allocates storage from the host's directory
- DNS - Supplies address resolution services to Kubernetes
- Ingress - Adds an NGINX Ingress Controller for MicroK8s

**In order to install the Addons, run:**

```bash
$ microk8s enable storage dns ingress
```

## Docker

Install Docker by following the instructions described [here](https://docs.docker.com/engine/install/ubuntu/ "here").

More specifically,

#### Set up the repository

```bash
$ sudo apt-get update
$ sudo apt-get install \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
$ curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
$ echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

#### Install Docker Engine (Latest version)

```bash
$ sudo apt-get update
$ sudo apt-get install docker-ce docker-ce-cli containerd.io
```

## Golang

You may install Golang by following the steps described [here (Official Documentation)](https://go.dev/doc/install "here (Official Documentation)").
However, you may also install Golang by using **snap**.

```bash
$ sudo snap install go --classic
```

## NodeJS & NPM

**To install NodeJS & NPM**, you may use nvm. To install nvm, you can use the instructions found [here](https://github.com/nvm-sh/nvm#installing-and-updating "here").
Then, run:

```
nvm install 14
nvm use 14
```

## Installing make, jq and pwgen

To install **make**, **jq** and **pwgen**, run:

```
sudo apt update
sudo apt install make jq pwgen -y
```

## Wine

You need Wine in order to build the executable of the _Client Application_ for the Windows OS.

Before installing Wine, you may need to add the _i386_ architecture. In order to do so, execute:

```
$ sudo dpkg --add-architecture i386
```

You may install Wine by using the apt repository of Ubuntu.

```
sudo apt update
sudo apt install wine64 -y
```

# Build the Images

### Hashicorp Vault Image

The ABE Plugin has some dependencies that need to be available on the Vault image.

You may examine the Dockerfile at: vault-secrets-abe-janus/Dockerfile, in order to inspect the extra dependencies that are installed on the Vault image.

To build the Vault image, at the root of the _Janus_ folder execute:

```bash
./initialize.sh vault_image
```

This command will build a custom Vault image (_vault-abe_) (ABE Plugin is also included in the image), which will include all the dependencies needed by the ABE Plugin and make the image available to Kubernetes (as _vault-abe:latest_).

### Application Images

| Applications                                    | Chaincodes      |
| ----------------------------------------------- | --------------- |
| Inter-Blockchain API ( _inter_blockchain_api_ ) | TMSC ( _tmsc_ ) |
| Backend API ( _backend_api_ )                   | PSC ( _psc_ )   |
| DB API ( _db_api_ )                             | LSC ( _lsc_ )   |
| DBC API ( _dbc_api_ )                           | KSSC ( _kssc_ ) |
| -                                               | ACSC ( _acsc_ ) |

**In order to build the images**, go under:

> Janus/kubernetes/scripts

and for each Application/Chaincode, run: **./build_image.sh** _app_name_.

For example,

    ./build_image.sh inter_blockchain_api

If you want, **you may build all the Images automatically**, by running:

    ./build_image.sh build_all

## Prepare the System for the Deployment

Before proceeding with the Deployment of the Application, there are two more extremely important steps:

1. Allow SSL termination at the Pods
2. Define the Server's public IP (_only if you need a custom IP and DO NOT want to utilize the system's Public IP_)

#### Allow SSL termination at the Pods.

Ingress is already initialized at Kubernetes. However, it does not support ssl-termination by default. There is a need to manually edit the _ingress config_ file, in order to support the termination of the SSL at the Pods.

Follow the below steps:

```
$ microk8s.kubectl get daemonset --all-namespaces
```

You should see a file with the name: _nginx-ingress-microk8s-controller_ (namespace: _ingress_). Edit the file:

```
$ microk8s.kubectl edit daemonset nginx-ingress-microk8s-controller -n ingress
```

Under _spec.template.spec.containers, update the \_args_ and **add**:

```bash
--enable-ssl-passthrough
```

Save and close the file. Ingress should be ready to accept connections and send them directly to the Pods.

_In order to successfully edit the ingress configuration file_, you may need to have Vim installed on the server. To install Vim, run:

    $ sudo apt install vim

#### Define the Server's public IP.

**By default**, the Application and the Client Application point to the IP _`XXX.XXX.XXX.XXX`_.

If you do not (manually) define the Public IP of your server, the project will automatically try to find it out and use it.

However, you may manually update it (not suggested), by following the instructions:

With a text editor find every entry that matches the _`XXX.XXX.XXX.XXX`_ IP and change it to the public IP of your server.

E.g., if your current server exposes its services at: 111.222.333.444, you should change every entry that is identical to _`XXX.XXX.XXX.XXX`_, to _111.222.333.444_.

**More specifically**, you must change the **INFRASTRUCTURE_ENDPOINT** variable, that you can find at:

> /Janus/kubernetes/scripts/network/scripts/init_values.sh

as well as every entry of _`XXX.XXX.XXX.XXX`_ that you will find at:

> /Janus/blockchain/client/client_application

# Deploy the Application

To deploy the Application, navigate to:

```bash
Janus/kubernetes/scripts/network
```

and run:

```bash
 $ ./network_bootstraper
```

The procedure needs (approximately) 20-25 minutes to complete.
At the end of the procedure, every Pod should be up and running on the Server.
You can find out if everything is okay, by running:

    $ kubectl get pods -n melity

(_Melity_ is the default _namespace_ that the Pods live in).
