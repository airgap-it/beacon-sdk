import React from 'react';
import { Typography } from '@mui/material';

type StatusType = 'success' | 'error' | null;

interface StatusIconProps {
    isLoading: boolean;
    status: StatusType;
}

const StatusIcon: React.FC<StatusIconProps> = ({ isLoading, status }) => {
    if (isLoading || !status) return null;

    return (
        <Typography
            component="span"
            sx={{
                // Base icon styles: make the container a perfect circle
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '1.5rem',
                height: '1.5rem',
                border: '2px solid white',
                borderRadius: '50%',
                fontWeight: 'bold',
                fontSize: '0.9rem', // Adjust font size so checkmark fits nicely
                marginBottom: '3px',
                opacity: 0,
                transition: 'opacity 0.3s ease',

                // SUCCESS icon styles & spinning animation
                ...(status === 'success' && {
                    animation: 'successAnimation 0.6s ease forwards',
                    '@keyframes successAnimation': {
                        '0%': {
                            opacity: 0,
                            transform: 'rotate(0deg)',
                        },
                        '100%': {
                            opacity: 1,
                            transform: 'rotate(360deg)',
                        },
                    },
                }),

                // ERROR icon styles & simple fade-in
                ...(status === 'error' && {
                    animation: 'fadeIn 0.3s ease forwards',
                    '@keyframes fadeIn': {
                        '0%': { opacity: 0 },
                        '100%': { opacity: 1 },
                    },
                }),
            }}
        >
            {status === 'success' ? '✓' : '✕'}
        </Typography>
    );
};

export default StatusIcon;
