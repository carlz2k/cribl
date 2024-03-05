import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

export const LogPageView = ({ logs, loading = false, }) => {
  return (
    <Box sx={{ m: 2 }}>
      <Box>
        {
          loading ? (<CircularProgress />) : (<></>)
        }
      </Box>
      <Box>
        {
          logs.map((log, index) => {
            return (<p key={index}>${log?.value}</p>);
          })
        }
      </Box>
    </Box>
  );
};
