import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Grid,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Search,
  Clear,
  FilterList,
  Today,
  DateRange,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { AppointmentFilters as FilterType } from '../../store/api';
import { formatDate, commonDateFormats } from '../../utils/dateUtils';

interface AppointmentFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  onClear: () => void;
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const AppointmentFilters: React.FC<AppointmentFiltersProps> = ({
  filters,
  onFiltersChange,
  onClear,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterType>(filters);

  const handleFilterChange = (key: keyof FilterType, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClear = () => {
    const clearedFilters: FilterType = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    onClear();
  };

  const handleTodayFilter = () => {
    const today = commonDateFormats.today.iso();
    handleFilterChange('date', today);
  };

  const getActiveFiltersCount = () => {
    return Object.values(localFilters).filter(value => 
      value !== undefined && value !== '' && value !== null
    ).length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <FilterList />
            <Typography variant="h6">
              Filters
            </Typography>
            {activeFiltersCount > 0 && (
              <Chip 
                size="small" 
                label={`${activeFiltersCount} active`}
                color="primary"
              />
            )}
          </Box>
          <Box>
            <Button
              size="small"
              onClick={handleTodayFilter}
              startIcon={<Today />}
              variant="outlined"
              sx={{ mr: 1 }}
            >
              Today
            </Button>
            <Button
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
              startIcon={<DateRange />}
              variant="outlined"
              sx={{ mr: 1 }}
            >
              {isExpanded ? 'Less' : 'More'}
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                size="small"
                onClick={handleClear}
                startIcon={<Clear />}
                color="secondary"
              >
                Clear
              </Button>
            )}
          </Box>
        </Box>

        <Grid container spacing={2}>
          {/* Patient Name Search */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search Patient"
              placeholder="Enter patient name..."
              value={localFilters.patient_name || ''}
              onChange={(e) => handleFilterChange('patient_name', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: localFilters.patient_name && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => handleFilterChange('patient_name', '')}
                    >
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Status Filter */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={localFilters.status || ''}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {isExpanded && (
            <>
              {/* Single Date Filter */}
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Specific Date"
                    value={localFilters.date ? new Date(localFilters.date) : null}
                    onChange={(date) => 
                      handleFilterChange('date', date ? formatDate.forAPI.dateOnly(date) : '')
                    }
                    slotProps={{
                      textField: { 
                        fullWidth: true,
                        InputProps: {
                          endAdornment: localFilters.date && (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => handleFilterChange('date', '')}
                              >
                                <Clear />
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              {/* Date Range - Start Date */}
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="From Date"
                    value={localFilters.start_date ? new Date(localFilters.start_date) : null}
                    onChange={(date) => 
                      handleFilterChange('start_date', date ? formatDate.forAPI.dateOnly(date) : '')
                    }
                    slotProps={{
                      textField: { 
                        fullWidth: true,
                        InputProps: {
                          endAdornment: localFilters.start_date && (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => handleFilterChange('start_date', '')}
                              >
                                <Clear />
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              {/* Date Range - End Date */}
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="To Date"
                    value={localFilters.end_date ? new Date(localFilters.end_date) : null}
                    onChange={(date) => 
                      handleFilterChange('end_date', date ? formatDate.forAPI.dateOnly(date) : '')
                    }
                    slotProps={{
                      textField: { 
                        fullWidth: true,
                        InputProps: {
                          endAdornment: localFilters.end_date && (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => handleFilterChange('end_date', '')}
                              >
                                <Clear />
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
            </>
          )}
        </Grid>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Active Filters:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {localFilters.patient_name && (
                <Chip
                  label={`Patient: ${localFilters.patient_name}`}
                  onDelete={() => handleFilterChange('patient_name', '')}
                  size="small"
                />
              )}
              {localFilters.status && (
                <Chip
                  label={`Status: ${statusOptions.find(s => s.value === localFilters.status)?.label}`}
                  onDelete={() => handleFilterChange('status', '')}
                  size="small"
                />
              )}
              {localFilters.date && (
                <Chip
                  label={`Date: ${formatDate.forDisplay.date(new Date(localFilters.date))}`}
                  onDelete={() => handleFilterChange('date', '')}
                  size="small"
                />
              )}
              {localFilters.start_date && (
                <Chip
                  label={`From: ${formatDate.forDisplay.date(new Date(localFilters.start_date))}`}
                  onDelete={() => handleFilterChange('start_date', '')}
                  size="small"
                />
              )}
              {localFilters.end_date && (
                <Chip
                  label={`To: ${formatDate.forDisplay.date(new Date(localFilters.end_date))}`}
                  onDelete={() => handleFilterChange('end_date', '')}
                  size="small"
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};