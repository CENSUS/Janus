from .client_setup import client


def test_no_host_no_api_header():
    '''
    Without a host header we should get:
    400: Bad request
    '''

    response = client.get("/")
    assert response.status_code == 400


def test_incorrect_host_header():
    '''
    With an incorrect host header but no api key we should get:
    400: Bad request
    '''

    headers = {"Host": "wrong"}
    response = client.get("/", headers=headers)
    assert response.status_code == 400


def test_correct_host_no_api_header():
    '''
    Without a correct host header but no api key we should get:
    403: Forbidden
    '''

    headers = {"Host": "db_api"}
    response = client.get("/", headers=headers)
    assert response.status_code == 403


def test_correct_host_wrong_api_header():
    '''
    With a correct host header and an incorrect api key we should get:
    401: Unauthorized
    '''

    headers = {"Host": "db_api", "api_key": "wrong"}
    response = client.get("/", headers=headers)
    assert response.status_code == 401


def test_correct_host_correct_api_header():
    '''
    With a correct host header and a correct api key we should get:
    200: Ok
    '''

    headers = {"Host": "db_api", "api_key": "test_api_key1"}
    response = client.get("/", headers=headers)
    assert response.status_code == 200
