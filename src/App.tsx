import { ProjectsHome } from '@/components/studio/ProjectsHome';
import { StudioLayout } from '@/components/studio/StudioLayout';
import { useProject } from '@/store/useStudio';

export default function App() {
  const project = useProject();
  return project ? <StudioLayout project={project} /> : <ProjectsHome />;
}
