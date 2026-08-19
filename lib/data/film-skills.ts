/**
 * Pre-built film and theatre industry skills database
 * Organized by department/category for easy reference
 */

export interface SkillCategory {
  category: string;
  skills: string[];
}

export const FILM_THEATRE_SKILLS: SkillCategory[] = [
  {
    category: 'Camera & Cinematography',
    skills: [
      'Camera Operation',
      'Cinematography',
      'Lighting Design',
      'Grip & Rigging',
      'Steadicam Operation',
      'Drone Operation',
      'DIT (Digital Imaging Technician)',
      'Camera Assistant',
      'Focus Pulling',
      'Shot Composition',
      'Exposure Control',
      'Color Theory'
    ]
  },
  {
    category: 'Sound & Audio',
    skills: [
      'Sound Recording',
      'Boom Operation',
      'Sound Mixing',
      'Sound Design',
      'Foley Artistry',
      'ADR (Automated Dialogue Replacement)',
      'Audio Post-Production',
      'Live Sound Engineering',
      'Wireless Microphone Systems',
      'Field Recording'
    ]
  },
  {
    category: 'Editing & Post-Production',
    skills: [
      'Video Editing',
      'Color Grading',
      'Color Correction',
      'VFX (Visual Effects)',
      'Motion Graphics',
      'Compositing',
      'Rotoscoping',
      'Audio Editing',
      'Final Cut Pro',
      'Adobe Premiere Pro',
      'DaVinci Resolve',
      'Avid Media Composer',
      'After Effects'
    ]
  },
  {
    category: 'Production Management',
    skills: [
      'Production Coordination',
      'Line Producing',
      'Production Management',
      'Scheduling',
      'Budgeting',
      'Crew Management',
      'Location Management',
      'Production Accounting',
      'Call Sheet Creation',
      'Script Breakdown',
      'Risk Assessment',
      'Contract Negotiation'
    ]
  },
  {
    category: 'Directing & Creative',
    skills: [
      'Directing',
      'Assistant Directing',
      'Script Supervision',
      'Storyboarding',
      'Shot List Creation',
      'Blocking',
      'Actor Direction',
      'Creative Vision',
      'Script Analysis',
      'Visual Storytelling',
      'Scene Planning'
    ]
  },
  {
    category: 'Art Department',
    skills: [
      'Production Design',
      'Art Direction',
      'Set Design',
      'Set Dressing',
      'Props Management',
      'Costume Design',
      'Makeup & Hair',
      'Special Effects Makeup',
      'Set Construction',
      'Scenic Painting',
      'Period Research'
    ]
  },
  {
    category: 'Theatre Production',
    skills: [
      'Stage Management',
      'Technical Direction',
      'Lighting Design (Theatre)',
      'Sound Design (Theatre)',
      'Set Construction (Theatre)',
      'Rigging',
      'Fly System Operation',
      'Front of House Management',
      'Stage Crew',
      'Props Master',
      'Wardrobe Management'
    ]
  },
  {
    category: 'Writing & Development',
    skills: [
      'Screenwriting',
      'Script Development',
      'Story Editing',
      'Dramaturgy',
      'Research',
      'Script Coverage',
      'Dialogue Writing',
      'Character Development',
      'Story Structure',
      'Adaptation'
    ]
  },
  {
    category: 'Software & Technical',
    skills: [
      'Final Cut Pro X',
      'Adobe Premiere Pro',
      'Adobe After Effects',
      'DaVinci Resolve',
      'Avid Media Composer',
      'Pro Tools',
      'Cinema 4D',
      'Blender',
      'Maya',
      'Photoshop',
      'Illustrator',
      'QLab',
      'Vectorworks',
      'AutoCAD'
    ]
  },
  {
    category: 'Soft Skills & Professional',
    skills: [
      'Team Collaboration',
      'Communication',
      'Time Management',
      'Problem Solving',
      'Adaptability',
      'Attention to Detail',
      'Working Under Pressure',
      'Creative Thinking',
      'Leadership',
      'Conflict Resolution',
      'Client Relations',
      'Multitasking'
    ]
  }
];

/**
 * Get all skills as a flat array
 */
export function getAllSkills(): string[] {
  return FILM_THEATRE_SKILLS.flatMap(category => category.skills);
}

/**
 * Search skills by keyword
 */
export function searchSkills(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  return getAllSkills().filter(skill =>
    skill.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get skills by category
 */
export function getSkillsByCategory(categoryName: string): string[] {
  const category = FILM_THEATRE_SKILLS.find(
    cat => cat.category.toLowerCase() === categoryName.toLowerCase()
  );
  return category?.skills || [];
}
