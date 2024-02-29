import Box from '@mui/material/Box';

export const LogPageView = ({ logs }) => {
  return (
    <Box>
      {
        logs.map((log, index) => {
          return (<p key={index}>${log?.value}</p>);
        })
      }
    </Box>
  );
};
