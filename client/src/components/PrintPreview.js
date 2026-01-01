import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import PrintHandler from './PrintHandler';
import PrintDialog from './PrintDialog';
import EmailPrintDialog from './email/EmailPrintDialog';
import EmailStatusDialog from './email/EmailStatusDialog';
import { useScheduling } from './SchedulingContext';
import axios from '../api/axios';

const PrintPreview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchFilteredEvents, doctors, technicians } = useScheduling();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isEmailStatusDialogOpen, setIsEmailStatusDialogOpen] = useState(false);
  const [emailStatusId, setEmailStatusId] = useState(null);

  // Create stable references for doctors and technicians to prevent unnecessary re-renders
  const doctorIds = useMemo(() => doctors.map(d => d.id).sort(), [doctors]);
  const technicianIds = useMemo(() => technicians.map(t => t.id).sort(), [technicians]);

  // Parse URL parameters with memoization to prevent infinite re-renders
  const filterParams = useMemo(() => {
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const view = searchParams.get('view') || 'month';

    // Parse arrays from URL with error handling (supports both old JSON and new ID formats)
    const parseArray = (param) => {
      try {
        const value = searchParams.get(param);
        if (!value) return [];

        // Try parsing as comma-separated IDs first (new format)
        if (param === 'doctors' || param === 'technicians' || param === 'tags') {
          if (!value.includes('[') && !value.includes('{')) {
            // This is the new comma-separated ID format
            return value.split(',').map(id => ({ id: parseInt(id) }));
          }
        }

        // Fall back to JSON parsing (old format or labels)
        return JSON.parse(decodeURIComponent(value));
      } catch (error) {
        console.error(`Error parsing ${param} parameter:`, error);
        return [];
      }
    };

    // Parse display options with error handling (support both old and new format)
    const parseDisplayOptions = () => {
      const defaultOpts = {
        showDescription: true,
        showLabel: true,
        showTechnicians: true,
        showOfficeNotes: false,
        doctorInfo: {
          showName: true,
          showAddress: false,
          showPhone: false,
        }
      };

      try {
        // Try new compact format first
        const compactOptsParam = searchParams.get('opts');
        if (compactOptsParam) {
          const compactOpts = JSON.parse(decodeURIComponent(compactOptsParam));
          return {
            showDescription: compactOpts.d !== undefined ? compactOpts.d : defaultOpts.showDescription,
            showLabel: compactOpts.l !== undefined ? compactOpts.l : defaultOpts.showLabel,
            showTechnicians: compactOpts.t !== undefined ? compactOpts.t : defaultOpts.showTechnicians,
            showOfficeNotes: compactOpts.on !== undefined ? compactOpts.on : defaultOpts.showOfficeNotes,
            doctorInfo: {
              showName: compactOpts.dn !== undefined ? compactOpts.dn : defaultOpts.doctorInfo.showName,
              showAddress: compactOpts.da !== undefined ? compactOpts.da : defaultOpts.doctorInfo.showAddress,
              showPhone: compactOpts.dp !== undefined ? compactOpts.dp : defaultOpts.doctorInfo.showPhone,
            }
          };
        }

        // Fall back to old format for backward compatibility
        const displayOptionsParam = searchParams.get('displayOptions');
        if (displayOptionsParam) {
          return JSON.parse(decodeURIComponent(displayOptionsParam));
        }
      } catch (error) {
        console.error('Error parsing display options:', error);
      }

      return defaultOpts;
    };

    const customHeader = searchParams.get('header');

    return {
      startDate,
      endDate,
      view,
      labels: parseArray('labels'),
      doctors: parseArray('doctors'),
      technicians: parseArray('technicians'),
      tags: parseArray('tags'),
      displayOptions: parseDisplayOptions(),
      customHeader: customHeader ? decodeURIComponent(customHeader) : ''
    };
  }, [searchParams]);

  // Fetch filtered events when component mounts or parameters change
  useEffect(() => {
    const loadEvents = async () => {
      if (!filterParams.startDate || !filterParams.endDate) {
        setLoading(false);
        setIsInitialLoad(false);
        return;
      }

      try {
        // Only show loading spinner on initial load to preserve scroll position
        if (isInitialLoad) {
          setLoading(true);
        }

        // Wait for reference data to load if we need it for ID expansion
        const needsDoctors = filterParams.doctors?.length > 0 && filterParams.doctors[0].id && !filterParams.doctors[0].customer;
        const needsTechnicians = filterParams.technicians?.length > 0 && filterParams.technicians[0].id && !filterParams.technicians[0].name;

        if ((needsDoctors && doctors.length === 0) || (needsTechnicians && technicians.length === 0)) {
          // Reference data not loaded yet, skip this render
          return;
        }

        let filters = {};
        if (filterParams.labels.length > 0) {
          filters.labels = filterParams.labels;
        }

        // Expand doctor IDs to full objects for API filtering
        if (filterParams.doctors.length > 0) {
          if (filterParams.doctors[0].id && !filterParams.doctors[0].customer) {
            // This is ID-only format, expand to full objects
            filters.doctors = doctors.filter(doctor =>
              filterParams.doctors.some(filterDoc => filterDoc.id === doctor.id)
            );
          } else {
            // This is already full object format
            filters.doctors = filterParams.doctors;
          }
        }

        // Expand technician IDs to full objects for API filtering
        if (filterParams.technicians.length > 0) {
          if (filterParams.technicians[0].id && !filterParams.technicians[0].name) {
            // This is ID-only format, expand to full objects
            filters.technicians = technicians.filter(technician =>
              filterParams.technicians.some(filterTech => filterTech.id === technician.id)
            );
          } else {
            // This is already full object format
            filters.technicians = filterParams.technicians;
          }
        }

        // Add tags to filters if provided
        if (filterParams.tags && filterParams.tags.length > 0) {
          filters.tags = filterParams.tags;
        }

        const filtered = await fetchFilteredEvents(
          filterParams.startDate,
          filterParams.endDate,
          filters
        );
        setEvents(filtered);
      } catch (error) {
        console.error('Error fetching filtered events:', error);
        setEvents([]);
      } finally {
        // Only set loading to false after initial load
        if (isInitialLoad) {
          setLoading(false);
          setIsInitialLoad(false);
        }
      }
    };

    loadEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterParams, fetchFilteredEvents, isInitialLoad, doctorIds, technicianIds]);

  const handleEdit = () => {
    setIsPrintDialogOpen(true);
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleClosePrintDialog = () => {
    setIsPrintDialogOpen(false);
  };

  const handlePrintDialogSubmit = (params) => {
    // The PrintDialog will handle navigation to the new URL with updated parameters
    // This function is called when user clicks "Preview" in the dialog
    setIsPrintDialogOpen(false);
  };

  const handleEmail = () => {
    setIsEmailDialogOpen(true);
  };

  const handleCloseEmailDialog = () => {
    setIsEmailDialogOpen(false);
  };

  const handleSendEmail = (params) => {
    console.log('Sending email with parameters:', params);
    setIsEmailDialogOpen(false);

    axios.post('/schedules/send-print-emails', params)
      .then(response => {
        console.log('Email sending process started:', response.data);

        // Open the status dialog with the returned ID
        if (response.data && response.data.id) {
          setEmailStatusId(response.data.id);
          setIsEmailStatusDialogOpen(true);
        }
      })
      .catch(error => {
        console.error('Error sending emails:', error);
        // TODO: Show error alert to user
      });
  };

  const handleCloseEmailStatusDialog = () => {
    setIsEmailStatusDialogOpen(false);
    setEmailStatusId(null);
  };

  // Expand ID-only filter params to full objects for PrintDialog
  const expandedFilterParams = useMemo(() => {
    if (!filterParams) return filterParams;

    const expanded = { ...filterParams };

    // Expand doctors
    if (expanded.doctors?.length > 0 && expanded.doctors[0].id && !expanded.doctors[0].customer) {
      expanded.doctors = doctors.filter(doctor =>
        filterParams.doctors.some(filterDoc => filterDoc.id === doctor.id)
      );
    }

    // Expand technicians
    if (expanded.technicians?.length > 0 && expanded.technicians[0].id && !expanded.technicians[0].name) {
      expanded.technicians = technicians.filter(technician =>
        filterParams.technicians.some(filterTech => filterTech.id === technician.id)
      );
    }

    // Tags are already ID-only format, no expansion needed
    // They will be expanded by PrintDialog when it receives them

    return expanded;
  }, [filterParams, doctors, technicians]);

  if (!filterParams.startDate || !filterParams.endDate) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Invalid print parameters. Please go back and set up your print options.
        </Typography>
        <Button
          onClick={handleBack}
          startIcon={<BackIcon />}
          variant="contained"
          sx={{ mt: 2 }}
        >
          Back to Schedule
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">Loading print preview...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PrintHandler
        events={events}
        view={filterParams.view}
        dateRange={{ start: filterParams.startDate, end: filterParams.endDate }}
        close={handleBack}
        filterParams={{
          ...filterParams,
          source: 'print'
        }}
        onEdit={handleEdit}
        onEmail={handleEmail}
        showEditButton={true}
      />

      <PrintDialog
        open={isPrintDialogOpen}
        onClose={handleClosePrintDialog}
        onPrint={handlePrintDialogSubmit}
        shouldReset={false}
        initialValues={expandedFilterParams}
      />

      <EmailPrintDialog
        open={isEmailDialogOpen}
        onClose={handleCloseEmailDialog}
        onSend={handleSendEmail}
        filterParams={filterParams}
      />

      <EmailStatusDialog
        open={isEmailStatusDialogOpen}
        onClose={handleCloseEmailStatusDialog}
        statusId={emailStatusId}
      />
    </Box>
  );
};

export default PrintPreview;