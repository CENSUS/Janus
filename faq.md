# FAQ

## System

#### How to redeploy the System?

If the System is already deployed, you may redeploy it by running:
`./initialize.sh project`

This script can be found at the root folder of the Janus project.
By running the above command, **everything** will be destroyed [namespace, pods included in the namespace etc.] and will be redeployed.

#### The server seems that it can handle <i>more/less</i> Requests/Second. How to reduce/increase them?

There are two configurations that can be altered. The System, does not support the on-the-fly update of these configurations. This means that upon changing them, the System must be redeployed.

- Backend API/Inter-Blockchain API Queues

  ![QUEUES_CONFIG](docs/images/queues-diagram.png?raw=true "QUEUES Config")

  By changing the Queues' concurrent requests number, the System can achieve more/less concurrent requests. To update the Queues' concurrent requests, edit the `MAX_CONCURRENT_CLIENTS` key at the file **rabbit-mq-queues-config.yaml** that can be found at:

  > Janus/kubernetes/templates/rabbit-mq/rabbit-mq-queues-config.yaml

- Blockchain Configuration

  Each Blockchain [Proxy/Medical/Manufacturer] has a `configtx.yaml` where it is defined the:

  1. Time to create a _block_
  2. Max transactions (included) per block

  These values can be updated at the files that can be found at:

  > Janus/kubernetes/templates/blockchains/configs/blockchain_configs/**[proxy/medical/manufacturer]**/consortium/configtx.yaml

  For more information, click [here](https://hyperledger-fabric.readthedocs.io/en/release-2.2/create_channel/create_channel_config.html?highlight=batchsize "here").

### I sent a request to the System. However, I cannot see any data through the Client Application.

If the request was approved by the System and the client's access has not expired, then the data should be accessible.
The only reason that you may are not able to access the data, is that the data may be encrypted and the client is not connected with Hashicorp Vault.
For example, if you send a request with `dataID: data_00` (a request that always returns encrypted data with ABE Encryption) and try to access the response data without being connected to the Hashicorp Vault, then you will not be able to access and see the data.
The solution to this, is to connect the client with Hashicorp Vault, by utilizing their Hashicorp Vault credentials, through the Client Application.

The Hashicorp Vault credential of the clients of the System can be found at:

> Janus/configs/organizations_info/subjects/clients.json

#### Where can I find the login credentials of the clients of the System?

The login credentials of all the available clients, are stored at:

- For [Doctors, Researchers, Technicians etc.]:

  > Janus/configs/organizations_info/subjects/clients.json

- For [Administrators, Auditors etc.]:
  > Janus/configs/organizations_info/organizations.json

For more information about the Administrators, Auditors etc. of the System, please kindly check the next question.

#### Where can I find the login credentials of the Stakeholders' Administrators?

The System supports many differents entities [i.e. CA-Admins, Auditors etc.].

You can find the credentials for these (and other) entities at:

> Janus/configs/organizations_info/organizations.json

```yaml
{
    "PROXY": {
        "CHANNELS": {
            # removed
        },
        "ORDERERS": [
            {
              # removed
            }
        ],
        "ORGANIZATIONS": [
            {
                ...
                "caAdmin": "caadminatho : caadminathopassword",
                "auditor": "auditoratho : auditorathopassword",
                ...
            }
```

### The data of various JSON files (e.g. `clients.json` file), are not in a human-readable form. What can I do?

You may install a `JSON formatter` plugin to your text editor or you may use a web application that formats JSON files in a human-readable form.

### Can I register new Identities?

Yes, by utilizing the `RCAAdmin` credentials of the Organization that you want to register the new client for. Use these credentials to connect to the System through the `Client Application`.

However, please kindly be informed that, in order for the newly created client to have ABE Decryption capabilities, you should also register the client at the Hashicorp Vault. This is a trivial process.

An alternative way to use the Client Registration System, is to reuse an existing Client.
For example, you can create a new Client with a different role, but under the same GID.

#### What does `Combine Identity` form, that exists in the Client Application, do?

Suppose that you own the Doctor role at a clinic. You may also own the Researcher role at this or any other clinic of any Stakeholder that belongs to the medical domain. These two or more Roles, share the same GUID. Thus, they belong to the same Identity: Doctor Role <=> GUID (client) <=> Researcher Role.

You can combine these Roles in order to acquire more rights to the System. For example, a <i>request</i> may require you to have both these Roles active in order to complete it. If you do not own the Doctor role or the Researcher role, then the request may fail to complete.

#### There are Temporal Roles that do not reflect the current [static] Role

A client is able to own more than one roles in the System (e.g. Doctor **AND** Researcher).
For example, a client can own the Doctor role, as well as the Researcher role at the same Stakeholder. While this client connects to the System through the Doctor role, the client can also see that there are Temporal Roles of type <i>Researcher</i> being displayed. These Temporal Roles **are not active** yet. They are being displayed in order to inform the client that they can enable them if they combine their available <i>Researcher</i> role, along with the <i>Doctor</i> role.

#### How can I make changes to the default ACLs that are appended to the Proxy Blockchain, while instantiating the TMSC?

In order to modify the default values of the ACLs, you may modify the file found at:

> Janus/configs/organizations_info/acl_init_info.json

#### How can I update the ACL of a Stakeholder?

In order to alter the ACL of a Stakeholder, create a `.json` file (e.g. `custom_acl.json`) and submit it with the CA Administrator of the Stakeholder, through the Client Application and the appropriate form that is implemented.

<details>
<summary>ACL Example</summary>

```yaml
{
  "ATTIKON-HOSPITAL":
    {
      "ACL":
        {
          "141debdc-cf00-417c-a7b9-b56268a984bc":
            {
              "DOCTOR_OF": ["d39d3d4f-1c39-48dc-82a3-a89ddb5d2f72"],
              "DOCTOR_WORK_SHIFT":
                {
                  "MONDAY":
                    [
                      { "FROM": "07:00", "TO": "14:00" },
                      { "FROM": "15:00", "TO": "16:00" },
                    ],
                  "TUESDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "WEDNESDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "THURSDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "FRIDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "SATURDAY": [{ "FROM": "18:00", "TO": "02:00" }],
                  "SUNDAY": [{ "FROM": "18:00", "TO": "02:00" }],
                },
              "RESEARCHER_WORK_SHIFT":
                {
                  "MONDAY":
                    [
                      { "FROM": "07:00", "TO": "14:00" },
                      { "FROM": "15:00", "TO": "16:00" },
                    ],
                  "TUESDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "WEDNESDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "THURSDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "FRIDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "SATURDAY": [{ "FROM": "18:00", "TO": "02:00" }],
                  "SUNDAY": [{ "FROM": "18:00", "TO": "02:00" }],
                },
            },
          "b34c611a-9970-4ace-9591-5d32246bb9dd":
            {
              "DOCTOR_OF": ["db1091cf-4884-4002-9db2-754761c1f14f"],
              "DOCTOR_WORK_SHIFT":
                {
                  "MONDAY":
                    [
                      { "FROM": "07:00", "TO": "12:00" },
                      { "FROM": "15:00", "TO": "18:00" },
                    ],
                  "TUESDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "WEDNESDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "THURSDAY":
                    [
                      { "FROM": "07:00", "TO": "10:00" },
                      { "FROM": "13:00", "TO": "18:00" },
                    ],
                  "FRIDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "SATURDAY": [],
                  "SUNDAY": [],
                },
              "RESEARCHER_WORK_SHIFT":
                {
                  "MONDAY":
                    [
                      { "FROM": "07:00", "TO": "14:00" },
                      { "FROM": "15:00", "TO": "16:00" },
                    ],
                  "TUESDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "WEDNESDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "THURSDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "FRIDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "SATURDAY": [{ "FROM": "18:00", "TO": "02:00" }],
                  "SUNDAY": [{ "FROM": "18:00", "TO": "02:00" }],
                },
            },
          "10b7b1ca-e993-4dc7-ae74-be54799deef5":
            {
              "DOCTOR_OF": ["56fa3ecb-e8d6-4975-92f6-6bb5ab7974ed"],
              "DOCTOR_WORK_SHIFT":
                {
                  "MONDAY":
                    [
                      { "FROM": "07:00", "TO": "12:00" },
                      { "FROM": "15:00", "TO": "18:00" },
                    ],
                  "TUESDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "WEDNESDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "THURSDAY":
                    [
                      { "FROM": "07:00", "TO": "10:00" },
                      { "FROM": "13:00", "TO": "18:00" },
                    ],
                  "FRIDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "SATURDAY": [],
                  "SUNDAY": [],
                },
              "RESEARCHER_WORK_SHIFT":
                {
                  "MONDAY":
                    [
                      { "FROM": "07:00", "TO": "14:00" },
                      { "FROM": "15:00", "TO": "16:00" },
                    ],
                  "TUESDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "WEDNESDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "THURSDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "FRIDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "SATURDAY": [{ "FROM": "18:00", "TO": "02:00" }],
                  "SUNDAY": [{ "FROM": "18:00", "TO": "02:00" }],
                },
            },
          "2269163b-a2cd-40b0-bf86-5c2b8047b37a":
            {
              "DOCTOR_OF": ["0cba7673-5157-43b0-baf9-110774431020"],
              "DOCTOR_WORK_SHIFT":
                {
                  "MONDAY":
                    [
                      { "FROM": "07:00", "TO": "12:00" },
                      { "FROM": "15:00", "TO": "18:00" },
                    ],
                  "TUESDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "WEDNESDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "THURSDAY":
                    [
                      { "FROM": "07:00", "TO": "10:00" },
                      { "FROM": "13:00", "TO": "18:00" },
                    ],
                  "FRIDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "SATURDAY": [],
                  "SUNDAY": [],
                },
              "RESEARCHER_WORK_SHIFT":
                {
                  "MONDAY":
                    [
                      { "FROM": "07:00", "TO": "14:00" },
                      { "FROM": "15:00", "TO": "16:00" },
                    ],
                  "TUESDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "WEDNESDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "THURSDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "FRIDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "SATURDAY": [{ "FROM": "18:00", "TO": "02:00" }],
                  "SUNDAY": [{ "FROM": "18:00", "TO": "02:00" }],
                },
            },
          "99319c9d-6dda-4cd2-9803-5b9a310cdb77":
            {
              "DOCTOR_OF": ["fbe11d8f-a925-4aad-a7ff-c2d965690e02"],
              "DOCTOR_WORK_SHIFT":
                {
                  "MONDAY":
                    [
                      { "FROM": "07:00", "TO": "12:00" },
                      { "FROM": "15:00", "TO": "18:00" },
                    ],
                  "TUESDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "WEDNESDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "THURSDAY":
                    [
                      { "FROM": "07:00", "TO": "10:00" },
                      { "FROM": "13:00", "TO": "18:00" },
                    ],
                  "FRIDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "SATURDAY": [],
                  "SUNDAY": [],
                },
              "RESEARCHER_WORK_SHIFT":
                {
                  "MONDAY":
                    [
                      { "FROM": "07:00", "TO": "14:00" },
                      { "FROM": "15:00", "TO": "16:00" },
                    ],
                  "TUESDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "WEDNESDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "THURSDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "FRIDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "SATURDAY": [{ "FROM": "18:00", "TO": "02:00" }],
                  "SUNDAY": [{ "FROM": "18:00", "TO": "02:00" }],
                },
            },
          "4fe6945e-5896-4bb1-89f2-2ee4a90bf6ef":
            {
              "TECHNICIAN_WORK_SHIFT":
                {
                  "MONDAY":
                    [
                      { "FROM": "07:00", "TO": "14:00" },
                      { "FROM": "18:30", "TO": "19:30" },
                    ],
                  "TUESDAY":
                    [
                      { "FROM": "07:00", "TO": "10:00" },
                      { "FROM": "19:00", "TO": "24:00" },
                    ],
                  "WEDNESDAY": [{ "FROM": "07:30", "TO": "15:30" }],
                  "THURSDAY": [{ "FROM": "07:30", "TO": "15:30" }],
                  "FRIDAY": [{ "FROM": "07:00", "TO": "15:30" }],
                  "SATURDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "SUNDAY": [{ "FROM": "15:00", "TO": "23:00" }],
                },
            },
          "b722511c-a35e-4b01-a510-5e889e9e12b5":
            {
              "TECHNICIAN_WORK_SHIFT":
                {
                  "MONDAY":
                    [
                      { "FROM": "07:00", "TO": "14:00" },
                      { "FROM": "18:30", "TO": "19:30" },
                    ],
                  "TUESDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "WEDNESDAY": [{ "FROM": "07:30", "TO": "15:30" }],
                  "THURSDAY": [{ "FROM": "07:45", "TO": "15:45" }],
                  "FRIDAY": [{ "FROM": "07:00", "TO": "15:00" }],
                  "SATURDAY": [],
                  "SUNDAY": [],
                },
            },
        },
      "ORGANIZATION": "ATTIKON-HOSPITAL",
    },
}
```

</details>

#### What is included in: _various_credentials.json_ file?

> Janus/configs/various/various_credentials.json

includes the credentials of distinct services of the system, such as _login credentials_ of an Application (e.g. RabbitMQ), _CA SSL Enrollment credentials_ (e.g. DB-API), _API Keys_ etc.

## Vault

#### Where is the Vault Root Token/Unseal Key(s)?

When Vault is initialized, a new Root Token, as well as an Unseal Key, are generated. You can find these keys at:

> Janus/configs/vault/init_values.json

#### How can I modify the Policies that approve access to the ABE Plugin?

In order to alter the Policies that allow access to the ABE Plugin, you may modify the files found at:

> Janus/configs/vault/policies

## Useful Resources

- [FastAPI](https://fastapi.tiangolo.com/)
- [SqlAlchemy](https://docs.sqlalchemy.org/en/14/)
- [Pydantic](https://pydantic-docs.helpmanual.io/)
- [PyTest](https://docs.pytest.org/en/stable/contents.html)
- [Flake](https://flake8.pycqa.org/en/latest/)
- [Docker](https://docs.docker.com/)
- [Kubernetes](https://kubernetes.io/docs/home/)
- [Hyperledger Fabric](https://www.hyperledger.org/use/fabric)
- [Hyperledger Fabric Node.js SDK](https://hyperledger.github.io/fabric-sdk-node/)
