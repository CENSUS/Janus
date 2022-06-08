from .client_setup import client


def get(_url, _headers):
    response = client.get(_url, headers=_headers)

    print(response.status_code)
    assert response.status_code == 200
    return response.json()


def post(_url, _headers, _body):
    if isinstance(_body, dict):
        response = client.post(_url, headers=_headers,
                               json=_body, allow_redirects=True)
    else:
        response = client.post(_url, headers=_headers,
                               data=_body, allow_redirects=True)

    print(response.status_code)
    assert response.status_code == 200
    return response.json()
