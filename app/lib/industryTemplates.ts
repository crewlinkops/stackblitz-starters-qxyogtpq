export type ServiceTemplate = {
    name: string;
    description: string;
    duration_min: number;
};

export type Industry = {
    id: string;
    name: string;
    icon: string;
    templates: ServiceTemplate[];
};

export const industryTemplates: Industry[] = [
    {
        id: "plumbing",
        name: "Plumbing",
        icon: "",
        templates: [
            {
                name: "Emergency Leak Repair",
                description: "Standard call response for active water leaks and burst pipes.",
                duration_min: 90,
            },
            {
                name: "Drain Cleaning & Clog Removal",
                description: "Professional camera inspection and drain clearing service.",
                duration_min: 60,
            },
            {
                name: "Water Heater Diagnostic",
                description: "Assessment of water heater issues or pilot light failure.",
                duration_min: 45,
            },
            {
                name: "Fixture Installation",
                description: "Installation of new faucets, sinks, or toilets (customer provided).",
                duration_min: 120,
            }
        ],
    },
    {
        id: "hvac",
        name: "HVAC",
        icon: "",
        templates: [
            {
                name: "AC Seasonal Tune-Up",
                description: "Multi-point inspection and cleaning for optimal summer cooling.",
                duration_min: 60,
            },
            {
                name: "Furnace Safety Inspection",
                description: "Standard diagnostic and safety check for heating systems.",
                duration_min: 45,
            },
            {
                name: "Thermostat Replacement",
                description: "Installation and setup of smart or standard thermostats.",
                duration_min: 45,
            },
            {
                name: "HVAC System Diagnostic",
                description: "General troubleshooting for systems that are not heating or cooling.",
                duration_min: 90,
            }
        ],
    },
    {
        id: "electrical",
        name: "Electrical",
        icon: "",
        templates: [
            {
                name: "Outlet & Switch Repair",
                description: "Troubleshooting non-functional or sparking outlets.",
                duration_min: 45,
            },
            {
                name: "Ceiling Fan Installation",
                description: "Standard assembly and mounting of ceiling fans.",
                duration_min: 90,
            },
            {
                name: "Panel Inspection",
                description: "Full circuit breaker panel safety and health audit.",
                duration_min: 60,
            },
            {
                name: "Light Fixture Replacement",
                description: "Removal of old fixture and installation of new lighting.",
                duration_min: 60,
            }
        ],
    },
    {
        id: "pest_control",
        name: "Pest Control",
        icon: "",
        templates: [
            {
                name: "Standard Pest Preventive",
                description: "Quarterly perimeter spray and interior baiting.",
                duration_min: 45,
            },
            {
                name: "Termite Inspection",
                description: "Full property wood-destroying organism inspection.",
                duration_min: 60,
            },
            {
                name: "Rodent Control Discovery",
                description: "Identification and sealing of entry points for mice/rats.",
                duration_min: 90,
            }
        ],
    },
    {
        id: "cleaning",
        name: "Cleaning",
        icon: "",
        templates: [
            {
                name: "Residential Deep Clean",
                description: "Extensive whole-home cleaning including baseboards and windows.",
                duration_min: 240,
            },
            {
                name: "Standard Weekly Maintenance",
                description: "Routine cleaning, vacuuming, and dusting.",
                duration_min: 120,
            },
            {
                name: "Move-In / Move-Out Scour",
                description: "Detailed empty-home cleaning for transitions.",
                duration_min: 300,
            }
        ],
    }
];
