import Navbar from '@/components/shared/Navbar';
import { BuilderHero, TheExpertise, TheIntersection, BuilderManifesto } from '@/components/builder/BuilderSections';

export default function BuilderPage() {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30 font-sans">
            <Navbar hideFloatingActionMenu={true} />
            <main>
                <BuilderHero />
                <TheExpertise />
                <TheIntersection />
                <BuilderManifesto />
            </main>
        </div>
    );
}
