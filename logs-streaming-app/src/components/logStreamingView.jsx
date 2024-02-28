import React, { useEffect, useState } from "react";
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Pagination from '@mui/material/Pagination';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import { LogPageView } from "./logPageView";
import { maxLogsAllowed } from "../services/api";
import { retrieveLogs } from "../services/api";

const ErrorMessage = {
  noFileName: 'File name cannot be empty.',
  limitPostive: 'Limit must be a positive number.',
  general: 'Cannot retrieve log file',
};

export const LogStreamingView = () => {
  const itemsPerPage = 10.00;

  const [logs, setLogs] = useState([]);
  const [pageCount, setPageCount] = useState();
  const [childItems, setChildItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [fileName, setFileName] = useState('taxi_zone_lookup.csv');
  const [keyword, setKeyword] = useState('');
  const [logRetrievalUrl, setLogRetrievalUrl] = useState('');
  const [limit, setLimit] = useState(maxLogsAllowed);
  const [error, setError] = useState('');

  const _validate = () => {
    if (!fileName) {
      setError(ErrorMessage.noFileName);
      return false;
    }

    if (limit <= 0) {
      setError(ErrorMessage.limitPostive);
      return false;
    }

    return true;
  };

  const retrieve = async () => {
    if (!_validate()) {
      return;
    }

    let currentLogs = [];
    setLogs([]);
    setError('');

    return retrieveLogs(fileName, limit, keyword,
      (data) => {
        if (currentLogs?.length < maxLogsAllowed) {
          const parsedLogs = JSON.parse(data)?.logs || [];
          currentLogs = currentLogs.concat(parsedLogs);
          setLogs(currentLogs);
          const pageCount = Math.ceil(currentLogs?.length / itemsPerPage);
          setPageCount(pageCount);
          setChildItems(logs.slice(0, itemsPerPage));
          setCurrentPage(1);
        }
      }, () => {
        setError(ErrorMessage.general);
      });
  };

  useEffect(() => {
    // TODO: this will be a serious performance issue once number of logs increase
    // probably better to put the logs in a map indexed by the page number
    // do not have time to implement right now
    // wonder how splunk does this, do they use server side rendering?
    setChildItems(logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
  }, [currentPage, logs]);

  useEffect(() => {
    let url = `http://127.0.0.1:8181/v1/streaming/logs?limit=${limit || maxLogsAllowed}&filter=(fileName eq "${fileName}") `;
    if (keyword) {
      url += ` and (keyword eq "${keyword}")`;
    }
    setLogRetrievalUrl(url);
  }, [fileName, limit, keyword]);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  }

  const handleFileNameChange = (e) => {
    setFileName(e.target.value);
  }

  const handleKeywordChange = (e) => {
    setKeyword(e.target.value);
  }

  const handleLimitChange = (e) => {
    setLimit(e.target.value);
  }

  return (
    <Container>
      {
        <Box gap={4} sx={{
          '& .MuiTextField-root': { m: 1, width: '25ch' },
        }}>
          <h1>Logs</h1>
          <Box>
            <TextField
              onChange={handleFileNameChange}
              required
              id="first"
              label="File Name"
              defaultValue={fileName}
            />
          </Box>
          <Box>
            <TextField
              onChange={handleKeywordChange}
              required
              id="first"
              label="Keyword"
              defaultValue={keyword}
            />
          </Box>
          <Box>
            <TextField
              onChange={handleLimitChange}
              required
              id="first"
              label={`Limit (${maxLogsAllowed} max for demo purpose)`}
              defaultValue={limit}
            />
          </Box>
          <Box sx={{ m: 2 }}>
            {
              error ? (
                <Alert severity="error">{error}</Alert>
              ) : (<></>)
            }
          </Box>
          <Box sx={{ m: 2 }}>
            <Button variant="outlined" onClick={retrieve}>
              Retrieve
            </Button>
          </Box>
          <Box sx={{ m: 2 }}>
            <Pagination count={pageCount} variant="outlined" shape="rounded" onChange={handlePageChange} />
            <LogPageView logs={childItems} />
          </Box>
        </Box>
      }
    </Container>
  );
}