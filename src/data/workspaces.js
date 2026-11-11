export const WORKSPACES = [
  {
    id: "individual",
    label: "Individual",
    audience: "ESPACIO PERSONAL",
    mode: "Gratuito · demostración",
    profileName: "Alejandro Mora",
    profileRole: "Estudiante",
    defaultSection: "explorer",
    sections: [
      { id: "explorer", label: "Explorador", icon: "search" },
      { id: "projects", label: "Proyectos", icon: "briefcase" },
      { id: "progress", label: "Progreso", icon: "sparkles" },
      { id: "history", label: "Historial", icon: "history" },
      { id: "reports", label: "Informes", icon: "file" },
      { id: "profile", label: "Perfil", icon: "user" },
    ],
  },
  {
    id: "institution",
    label: "Institución",
    audience: "ESPACIO EDUCATIVO",
    mode: "Licencia institucional · conceptual",
    profileName: "Coordinación",
    profileRole: "Institución educativa",
    defaultSection: "cohorts",
    sections: [
      { id: "cohorts", label: "Cohortes", icon: "user" },
      { id: "assignments", label: "Asignaciones", icon: "clipboard-list" },
      { id: "activity", label: "Seguimiento", icon: "history" },
      { id: "reports", label: "Informes", icon: "file" },
    ],
  },
  {
    id: "company",
    label: "Empresa",
    audience: "ESPACIO DE EQUIPO",
    mode: "Licencia empresarial · conceptual",
    profileName: "Administración",
    profileRole: "Empresa",
    defaultSection: "teams",
    sections: [
      { id: "teams", label: "Equipos", icon: "briefcase" },
      { id: "simulations", label: "Simulaciones", icon: "clipboard-list" },
      { id: "training", label: "Capacitación", icon: "sparkles" },
      { id: "reports", label: "Informes", icon: "file" },
    ],
  },
  {
    id: "creator",
    label: "Administrador",
    audience: "GESTIÓN DE CONTENIDO",
    mode: "Herramientas de creación",
    profileName: "Equipo WORKSIM",
    profileRole: "Administrador y creador",
    defaultSection: "bank",
    sections: [
      { id: "bank", label: "Banco", icon: "clipboard-list" },
      { id: "editor", label: "Editor", icon: "edit" },
      { id: "competencies", label: "Competencias", icon: "brain" },
      { id: "evaluation", label: "Evaluación", icon: "clipboard-check" },
      { id: "publication", label: "Publicación", icon: "check" },
    ],
  },
];

export function getWorkspace(workspaceId) {
  return WORKSPACES.find((workspace) => workspace.id === workspaceId) || WORKSPACES[0];
}
