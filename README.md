# Logs Retrieval API

This is an app that allows user to retrieve lines, most recent first,
from a file in /var/log directory.

## Features
1) User can stream a file by specifying a file name
2) User can search the last n lines of a file
3) User can search keywords in a file
4) The API is event based and pushes data to the client via event-stream

## Install and Run the app

    clone the repo, and in the working directory run
    sh run_app.sh

## Run tests

    To run unit tests
    npm run test

    Additionally, a postman collection is provided in the test_scripts directory

# UI

A basic UI is provied for the demo purpose.  It allows user to search logs files in /var/logs by
specifying fileName, keyword, and limit.  The maximum number of logs can be returned is 500000.
UI might stop functioning beyong that limit because events are pushed in a high rate and high volume
which will cause UI to freeze or run out of memory.  To improve the performance, some form of the rate
limit should be implemented to allow user to control the speed of flow of logs.

# REST API

The REST API is described below.

## Get logs

### Request

`GET /v1/streaming/logs`

    curl --location 'http://127.0.0.1:8181/v1/streaming/logs'

### Query Parameters

    filter: A scim style query string that contains the filter to filter the logs.  This is a required field.
            fileName filter is a required field that is used to specify the name of a file in /var/log.  keyword
            filter is option and is used for search specific text in the file.
            Example: filter=(fileName eq "abc.txt" and keyword eq "01/02/2024")
    limit: An integer that represents the number of last entries to be returned.  The maximum allowed is 500000.
           Example:  limit=10

### Response

    HTTP/1.1 200 OK
    Date: Thu, 24 Feb 2011 12:36:30 GMT
    Status: 200 OK
    Cache-Control: no-cache
    Connection: keep-alive
    Content-Type: text/event-stream
    Transfer-Encoding: chunked

    data: {"logs":["B02942,2017-04-01 00:21:58,,,"],"count":1,"requestId":"2ef72aa8-3260-4005-a0e8-01f85beadb5c"}\n\n

# Design Documentation

1) A brief description of the design of this application: https://docs.google.com/document/d/1hVqFm-HP4maUlXLuWN438JxQ-PHpyDYeQL_A1Oajpyg/edit
2) A brief description of the design of the bonus qeustion: https://docs.google.com/document/d/1ORNcGmf3dumybolWGdMK32xwYdI52ibsXrHJP64dz7k/edit?usp=sharing