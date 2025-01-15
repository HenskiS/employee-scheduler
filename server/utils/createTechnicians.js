// Sample technician data
const technicians = [
    {
      name: "Sarah Johnson",
      email: "sarah.j@techwizard.com",
      phoneNumber: "555-0123",
      experienceLevel: 5
    },
    {
      name: "Mike Chen",
      email: "mike.chen@techwizard.com",
      experienceLevel: 3
    },
    {
      name: "Alex Rodriguez",
      email: "a.rodriguez@techwizard.com",
      phoneNumber: "555-0124",
      experienceLevel: 7
    },
    {
      name: "Emma Williams",
      email: "emma.w@techwizard.com",
      experienceLevel: 1
    },
    {
      name: "David Kumar",
      email: "d.kumar@techwizard.com",
      phoneNumber: "555-0125"
    },
    {
      name: "Lisa Thompson",
      email: "l.thompson@techwizard.com",
      phoneNumber: "555-0126",
      experienceLevel: 4
    },
    {
      name: "James Wilson",
      email: "j.wilson@techwizard.com",
      experienceLevel: 6
    },
    {
      name: "Maria Garcia",
      email: "m.garcia@techwizard.com",
      phoneNumber: "555-0127",
      experienceLevel: 2
    },
    {
      name: "Tom Anderson",
      email: "t.anderson@techwizard.com",
      phoneNumber: "555-0128"
    },
    {
      name: "Sophie Lee",
      email: "s.lee@techwizard.com",
      experienceLevel: 8
    }
  ];
  
  // Function to create a technician
  async function createTechnician(techData) {
    try {
      const response = await fetch('http://localhost:5000/api/technicians', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(techData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Successfully created technician: ${techData.name}`);
      return data;
    } catch (error) {
      console.error(`Error creating technician ${techData.name}:`, error.message);
      return null;
    }
  }
  
  // Function to create all technicians
  async function createAllTechnicians() {
    console.log('Starting technician creation...');
    
    for (const techData of technicians) {
      await createTechnician(techData);
      // Add a small delay between requests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('Finished creating technicians');
  }
  
  // Run the script
  createAllTechnicians().catch(error => {
    console.error('Script failed:', error);
  });