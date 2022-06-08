# Unit tests

Each module has in it's main directory a `test` directory.
Inside that one there are unit test for the specific module.

Currently these tests to test the main functionality but they are in
no way a complete suite.
In the future these test cases should be expanded if possible.


## Running Test.

To run the tests of a module, move into it's directory and then call `pytest`.

Pytest automatically recognizes files named as `test_*.py` of `*test.py` as
test files and will run them.
Functions inside the test file should have a similar name convention,
either stating or ending with the word *test*

```bash
$ cd api/db_requests/tests

# run all test under api/db_requests/tests
# and it's subdirectories
$ python -m pytest

# run only one file
$ python -m pytest test_firmware.py

# run all test, except one file
# you can exclude multiple items if you wish with multiple ignore statements
$ python -m pytest --ignore=test_firmware.py
```

When specifying files implicitly or when excluding them,
the argument can be a directory name to specify all the files inside that directory,
or even a pattern like `*test.py`

## DB API

Only for the `db_api` module one extra step is required to run the tests.
Because we need the databases to be up and running when we run our test,
we have to run the tests inside the docker instance.

```bash
$ docker-compose up -d

# get a shell in db_api container
$ docker exec -it db_api /bin/bash

# run test ass usual
$ python -m pytest

# alternatively you can combine the last two commands in one
$ docker exec -it db_api python -m pytest
```


