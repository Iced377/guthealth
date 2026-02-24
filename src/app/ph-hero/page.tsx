import Image from 'next/image';
import { notFound } from 'next/navigation';

export default function ProductHuntHeroPage({ searchParams }: { searchParams?: { frame?: string } }) {
    if (searchParams?.preview !== '1') {
        notFound();
    }
    const showFrame = searchParams?.frame !== 'off';

    return (
        <div className="min-h-screen w-full bg-[#f6f7f8] flex items-center justify-center">
            <div
                className={`relative w-[1270px] h-[760px] overflow-hidden bg-white ${showFrame ? 'border border-slate-200' : 'border border-transparent'}`}
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_55%)]" />

                <div className="absolute top-[54px] left-1/2 -translate-x-1/2 text-center max-w-4xl px-6 font-sans">
                    <div className="flex items-center justify-center gap-6">
                        <div className="relative h-[112px] w-[112px] rounded-full overflow-hidden border border-emerald-100 shadow-[0_12px_30px_rgba(16,185,129,0.18)] bg-emerald-50">
                            <Image
                                src="/opengraph-image.jpg"
                                alt="Gutcheck character"
                                fill
                                className="object-cover object-center scale-110"
                                sizes="112px"
                                priority
                            />
                        </div>
                        <h1 className="text-[54px] leading-[1.05] font-semibold tracking-tight text-slate-900 text-left">
                            <span className="block whitespace-nowrap">Log Meals in Seconds.</span>
                            <span className="block text-emerald-600">Turn data into insight.</span>
                        </h1>
                    </div>
                    <p className="mt-4 text-[20px] text-slate-500">
                        Build a daily habit. Discover what actually works for your body.
                    </p>
                </div>

                <div className="absolute left-1/2 top-[300px] -translate-x-1/2 w-full px-16">
                    <div className="flex items-start justify-center gap-12">
                        <div className="flex flex-col items-center">
                            <div className="relative w-[200px] h-[400px]">
                                <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-[#2a2f3a] via-[#0f1115] to-[#050608] shadow-[0_26px_60px_rgba(15,23,42,0.22)] border border-[#2b313c]" />
                                <div className="absolute inset-[4px] rounded-[36px] bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
                                <div className="absolute inset-[10px] rounded-[30px] bg-black overflow-hidden">
                                    <Image
                                        src="/describeit.jpeg"
                                        alt="Describe meal"
                                        fill
                                        className="object-cover"
                                        sizes="200px"
                                        priority
                                    />
                                </div>
                                <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[84px] h-[22px] bg-black rounded-[14px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] z-20" />
                                <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[54px] h-[6px] bg-[#1f2530] rounded-full z-30" />
                                <div className="absolute left-[-3px] top-[96px] w-[3px] h-[26px] bg-[#2b313c] rounded-r-md" />
                                <div className="absolute left-[-3px] top-[134px] w-[3px] h-[38px] bg-[#2b313c] rounded-r-md" />
                                <div className="absolute right-[-3px] top-[118px] w-[3px] h-[54px] bg-[#2b313c] rounded-l-md" />
                            </div>
                            <div className="mt-4 text-[14px] font-semibold text-slate-600">Describe it</div>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="relative w-[200px] h-[400px]">
                                <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-[#2a2f3a] via-[#0f1115] to-[#050608] shadow-[0_26px_60px_rgba(15,23,42,0.22)] border border-[#2b313c]" />
                                <div className="absolute inset-[4px] rounded-[36px] bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
                                <div className="absolute inset-[10px] rounded-[30px] bg-black overflow-hidden">
                                    <Image
                                        src="/Snapit.jpeg"
                                        alt="Snap meal"
                                        fill
                                        className="object-cover"
                                        sizes="200px"
                                    />
                                </div>
                                <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[84px] h-[22px] bg-black rounded-[14px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] z-20" />
                                <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[54px] h-[6px] bg-[#1f2530] rounded-full z-30" />
                                <div className="absolute left-[-3px] top-[96px] w-[3px] h-[26px] bg-[#2b313c] rounded-r-md" />
                                <div className="absolute left-[-3px] top-[134px] w-[3px] h-[38px] bg-[#2b313c] rounded-r-md" />
                                <div className="absolute right-[-3px] top-[118px] w-[3px] h-[54px] bg-[#2b313c] rounded-l-md" />
                            </div>
                            <div className="mt-4 text-[14px] font-semibold text-slate-600">Snap it</div>
                        </div>

                        <div className="flex flex-col items-center relative z-10 scale-[1.04] -translate-y-1">
                            <div className="relative w-[200px] h-[400px]">
                                <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-[#2a2f3a] via-[#0f1115] to-[#050608] shadow-[0_26px_60px_rgba(15,23,42,0.22)] border border-[#2b313c]" />
                                <div className="absolute inset-[4px] rounded-[36px] bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
                                <div className="absolute inset-[10px] rounded-[30px] bg-black overflow-hidden">
                                    <Image
                                        src="/understandit.jpeg"
                                        alt="Understand meal"
                                        fill
                                        className="object-cover"
                                        sizes="200px"
                                    />
                                </div>
                                <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[84px] h-[22px] bg-black rounded-[14px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] z-20" />
                                <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[54px] h-[6px] bg-[#1f2530] rounded-full z-30" />
                                <div className="absolute left-[-3px] top-[96px] w-[3px] h-[26px] bg-[#2b313c] rounded-r-md" />
                                <div className="absolute left-[-3px] top-[134px] w-[3px] h-[38px] bg-[#2b313c] rounded-r-md" />
                                <div className="absolute right-[-3px] top-[118px] w-[3px] h-[54px] bg-[#2b313c] rounded-l-md" />
                            </div>
                            <div className="mt-4 text-[14px] font-semibold text-slate-600">Understand it</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
