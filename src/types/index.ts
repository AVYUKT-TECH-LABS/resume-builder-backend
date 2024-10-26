interface ContactData {
    email: string;
    link: string;
    location: string;
    name: string;
    phone: string;
    title: string;
}

interface Contact {
    data: ContactData;
}

interface EducationItem {
    bullets: string[];
    degree: string;
    instituteName: string;
    location: string;
    period: string;
}

interface ExperienceItem {
    bullets: string[];
    companyName: string;
    location: string;
    period: string;
    title: string;
}

interface SkillItem {
    skill: string;
    skillheading: string;
}

interface ProjectItem {
    bullets: string[];
    period: string;
    projectName: string;
}

type SectionItem = {
    data: EducationItem | ExperienceItem | SkillItem | ProjectItem;
};

interface Section {
    containerId: string | null;
    containerPosition: number;
    list: SectionItem[];
    title: string;
    type: 'education' | 'experience' | 'skills' | 'projects' | 'achievements';
}

export interface Resume {
    id: string;
    contact: Contact;
    sections: Section[];
}

export interface DashboardData {
    organizationId: string;
    total_applications: number;
    total_jobs: number;
    total_rejected: number;
    total_shortlisted: number;
    application_status_counts: ApplicationStatusCounts;
}

export interface ApplicationStatusCounts {
    [key: string]: number;
}

export interface VectorSearchResult {
    _id: string;
    jobId: string;
    score: number;
}
