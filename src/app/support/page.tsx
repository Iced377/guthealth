'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, MessageSquare, Mail, HelpCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import GradientText from '@/components/shared/GradientText';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const SupportPage = () => {
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await addDoc(collection(db, 'contact_submissions'), {
                name: formData.name,
                email: formData.email,
                subject: formData.subject,
                message: formData.message,
                status: 'new',
                createdAt: serverTimestamp()
            });

            toast({
                title: "Message Sent",
                description: "We've received your message and will get back to you soon!",
                duration: 5000,
            });

            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            console.error("Error submitting form:", error);
            toast({
                title: "Submission Failed",
                description: "Something went wrong. Please try again later.",
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const faqs = [
        {
            question: "What is GutCheck?",
            answer: (
                <div className="space-y-4">
                    <p>Unlock your body's potential with GutCheck, the nutrition companion that goes beyond simple calorie counting.</p>
                    <p>GutCheck isn't just about numbers; it's about understanding you. By combining effortless AI food logging with advanced pattern recognition, GutCheck helps you discover exactly how your nutrition impacts your health, energy, and goals.</p>

                    <div>
                        <strong className="block mb-2 text-foreground">Key Features:</strong>
                        <ul className="space-y-2 list-none pl-0">
                            <li><span className="mr-1">🥗</span> <strong>Effortless AI Logging:</strong> Forget the tedious searching. Snap a photo, type a few words, or reuse a past meal with just one click—our AI instantly breaks down the rest.</li>
                            <li><span className="mr-1">🔗</span> <strong>Seamless Integration:</strong> Connected to your life. Automatically syncs with Apple Health and Fitbit to pull in your activity, steps, and weight data, keeping your health picture complete without the manual work.</li>
                            <li><span className="mr-1">🧠</span> <strong>Nutrition Intelligence:</strong> Identify hidden patterns in your habits. GutCheck connects the dots between what you eat and your health metrics, giving you a true understanding of your body's needs.</li>
                            <li><span className="mr-1">📊</span> <strong>Purposeful Insights:</strong> Turn raw data into actionable advice. Receive personalized feedback designed to help you optimize your diet, whether you're focusing on gut health, weight management, or peak performance.</li>
                            <li><span className="mr-1">📉</span> <strong>Smart Trends:</strong> Visualise your journey with beautiful, intuitive charts that track your consistency and progress over time.</li>
                            <li><span className="mr-1">🥑</span> <strong>Comprehensive Tracking:</strong> From Keto to Glycemic Index, track the metrics that matter most to your specific lifestyle.</li>
                        </ul>
                    </div>
                    <p className="italic text-primary">Stop guessing. Start knowing. Experience nutrition intelligence designed for your life.</p>
                    <p className="font-bold">Your Body. By Design.</p>
                </div>
            )
        },
        {
            question: "Can I export my data?",
            answer: "Yes! Go to your Profile > User Center and look for the 'Download My Data' option to get a copy of your logs."
        },
        {
            question: "How do I delete my account?",
            answer: "We're sorry to see you go. You can request account deletion from the Profile settings or by contacting us directly through this form."
        },
        {
            question: "Is GutCheck free to use?",
            answer: "GutCheck is currently in beta and free to use. We may introduce premium features in the future, but core logging will remain accessible."
        }
    ];

    return (
        <div className="min-h-screen bg-background relative selection:bg-primary/30">

            {/* Background Gradients */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50 mix-blend-screen animate-blob" />
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-50 mix-blend-screen animate-blob animation-delay-2000" />
                <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-green-400/10 rounded-full blur-3xl opacity-50 mix-blend-screen animate-blob animation-delay-4000" />
            </div>

            <div className="container mx-auto px-4 pt-24 pb-32">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-muted/50 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-foreground/80" />
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold font-headline">
                        <GradientText>Support Center</GradientText>
                    </h1>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Left Column: Contact Form */}
                    <div className="lg:col-span-2">
                        <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-2xl">
                                    <Mail className="w-6 h-6 text-primary" />
                                    Contact Us
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Have a question, feedback, or need help? Fill out the form below and we'll get back to you as soon as possible.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Name</label>
                                            <Input
                                                id="name"
                                                name="name"
                                                placeholder="Your name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                className="bg-background/50 border-white/10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="your@email.com"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                                className="bg-background/50 border-white/10"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="subject" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Subject</label>
                                        <Input
                                            id="subject"
                                            name="subject"
                                            placeholder="How can we help?"
                                            value={formData.subject}
                                            onChange={handleInputChange}
                                            required
                                            className="bg-background/50 border-white/10"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="message" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Message</label>
                                        <Textarea
                                            id="message"
                                            name="message"
                                            placeholder="Tell us more about your inquiry..."
                                            value={formData.message}
                                            onChange={handleInputChange}
                                            required
                                            className="min-h-[150px] bg-background/50 border-white/10 resize-y"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full sm:w-auto"
                                        size="lg"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-2" />
                                                Send Message
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: FAQs & Info */}
                    <div className="space-y-6">

                        {/* FAQs */}
                        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <HelpCircle className="w-5 h-5 text-primary" />
                                    Frequently Asked Questions
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible className="w-full">
                                    {/* General */}
                                    <AccordionItem value="item-what-is" className="border-white/10">
                                        <AccordionTrigger className="text-left hover:text-primary transition-colors">
                                            What is GutCheck?
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground space-y-4">
                                            <p>GutCheck is your intelligent nutrition companion. It goes beyond simple calorie counting to help you understand how your food affects your body, energy, and overall health.</p>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* Features - New */}
                                    <AccordionItem value="item-features" className="border-white/10">
                                        <AccordionTrigger className="text-left hover:text-primary transition-colors">
                                            What are the key features?
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground space-y-2">
                                            <ul className="list-disc list-inside space-y-1 ml-1">
                                                <li><strong>AI Food Analysis:</strong> Instant nutrition estimation from photos or text.</li>
                                                <li><strong>FODMAP Detection:</strong> Alerts for high-FODMAP ingredients to manage gut sensitivities.</li>
                                                <li><strong>Symptom Correlation:</strong> Link your meals to how you feel (bloating, energy, focus).</li>
                                                <li><strong>Trends Dashboard:</strong> Visualize your long-term habits and health progression.</li>
                                                <li><strong>Wearable Sync:</strong> Integrate activity data for a complete health picture.</li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* Diets & FODMAP - New */}
                                    <AccordionItem value="item-fodmap" className="border-white/10">
                                        <AccordionTrigger className="text-left hover:text-primary transition-colors">
                                            Can GutCheck identify high FODMAP meals?
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground">
                                            Yes! Our AI is trained to recognize ingredients and can highlight high-FODMAP foods. This is especially helpful if you are following a low-FODMAP diet or managing IBS triggers.
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="item-fasting" className="border-white/10">
                                        <AccordionTrigger className="text-left hover:text-primary transition-colors">
                                            Can I use GutCheck for Intermittent Fasting?
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground">
                                            Absolutely. Every meal log is automatically timestamped, allowing you to easily track your eating window and analyze how your fasting schedule impacts your energy levels and symptoms.
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="item-restricted" className="border-white/10">
                                        <AccordionTrigger className="text-left hover:text-primary transition-colors">
                                            Can I use GutCheck on a restricted diet?
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground">
                                            Yes, GutCheck supports any dietary lifestyle (Vegan, Keto, Gluten-Free, Paleo, etc.). The AI simply analyzes what you eat, regardless of the rules you follow, helping you understand the nutritional quality and impact of your specific diet.
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* Accuracy */}
                                    <AccordionItem value="item-accuracy" className="border-white/10">
                                        <AccordionTrigger className="text-left hover:text-primary transition-colors">
                                            How accurate is the AI nutrition tracking?
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground space-y-2">
                                            <p>Our AI uses advanced models to estimate nutrition from your photos and descriptions. While highly capable, it provides <strong>estimates</strong> rather than medical-grade precision.</p>
                                            <p>It's designed to help you track <em>trends</em> and <em>consistency</em> over time, which are more important for long-term health than exact gram-perfect precision.</p>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* How to Log */}
                                    <AccordionItem value="item-logging" className="border-white/10">
                                        <AccordionTrigger className="text-left hover:text-primary transition-colors">
                                            How do I log my meals?
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground space-y-2">
                                            <p>You have two easy ways/modes to log:</p>
                                            <ul className="list-disc list-inside space-y-1 ml-1">
                                                <li><strong>Snap & Track:</strong> Simply take a photo of your food. The AI identifies it instantly.</li>
                                                <li><strong>Describe It:</strong> Type normally, e.g., "I had a chicken salad with avocado."</li>
                                            </ul>
                                            <p className="text-xs italic mt-2">Tip: You can also log symptoms (like "bloating" or "high energy") to see how they correlate with your food!</p>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* Benefits */}
                                    <AccordionItem value="item-benefits" className="border-white/10">
                                        <AccordionTrigger className="text-left hover:text-primary transition-colors">
                                            How can I benefit from the app?
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground space-y-2">
                                            <p>By using GutCheck consistently, you can:</p>
                                            <ul className="list-disc list-inside space-y-1 ml-1">
                                                <li><strong>Identify Triggers:</strong> See which foods correlate with negative symptoms.</li>
                                                <li><strong>Optimize Energy:</strong> Discover what meals fuel your best days.</li>
                                                <li><strong>Visualise Habits:</strong> Our "Trends" tab shows you long-term patterns you might miss day-to-day.</li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* Best Practices */}
                                    <AccordionItem value="item-tips" className="border-white/10">
                                        <AccordionTrigger className="text-left hover:text-primary transition-colors">
                                            What are the best practices for success?
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground space-y-2">
                                            <p><strong>Consistency is key.</strong> Log every meal, even the small snacks. The more data you provide, the smarter your personal AI insights become.</p>
                                            <p>Also, try to connect a wearable (Apple Health or Fitbit) to get a truly holistic view of how your activity levels interact with your nutrition; otherwise, you have the option to manually add them.</p>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="item-export" className="border-white/10">
                                        <AccordionTrigger className="text-left hover:text-primary transition-colors">
                                            Can I export my data?
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground">
                                            Yes! Go to your Profile {'>'} User Center and look for the "Download My Data" option to get a full copy of your logs.
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="item-delete" className="border-white/10">
                                        <AccordionTrigger className="text-left hover:text-primary transition-colors">
                                            How do I delete my account?
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground">
                                            You can delete your account instantly from the Profile page (look for the red "Delete Account" button), or by contacting us through this form.
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="item-cost" className="border-white/10">
                                        <AccordionTrigger className="text-left hover:text-primary transition-colors">
                                            Is GutCheck free to use?
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground">
                                            GutCheck is currently in early stage development and is free to use. We may introduce a premium in the future.
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* Security - New */}
                                    <AccordionItem value="item-security" className="border-white/10">
                                        <AccordionTrigger className="text-left hover:text-primary transition-colors">
                                            How is my data secured and handled?
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground">
                                            We take data security seriously. Your data is encrypted in transit and at rest. For full details on how we handle, process, and protect your information, please review our <Link href="/privacy" className="text-primary hover:underline">Privacy Notice</Link>.
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportPage;
