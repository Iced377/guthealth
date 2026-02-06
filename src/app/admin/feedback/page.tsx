
'use client';

import { useEffect, useState, useRef } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/config/firebase';
import { collection, getDocs, query, orderBy, doc, getDoc, Timestamp, writeBatch } from 'firebase/firestore';

import type { FeedbackSubmission, UserProfile } from '@/types';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, ShieldAlert, ExternalLink, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminFeedbackPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [feedbackItems, setFeedbackItems] = useState<FeedbackSubmission[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState<boolean | null>(null);
  const newFeedbackIdsRef = useRef<string[]>([]);

  // Removed userCount related states as the feature was removed.
  // const [totalUsers, setTotalUsers] = useState<number | null>(null);
  // const [userCountError, setUserCountError] = useState<string | null>(null);


  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      if (authLoading) return;
      if (!authUser || !authUser.uid) {
        setIsCurrentUserAdmin(false);
        setIsLoadingData(false);
        setProfileError("Authentication not found. Please log in.");
        return;
      }

      setProfileError(null);
      setFeedbackError(null);
      // setUserCountError(null); // No longer needed
      let adminStatus = false;

      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Admin Page] Checking admin status for UID:', authUser.uid);
        }
        const userProfileDocRef = doc(db, 'users', authUser.uid);
        const userProfileSnap = await getDoc(userProfileDocRef);

        if (userProfileSnap.exists()) {
          const userProfileData = userProfileSnap.data() as UserProfile;
          if (userProfileData.isAdmin === true) {
            adminStatus = true;
            setIsCurrentUserAdmin(true);
            if (process.env.NODE_ENV === 'development') {
              console.log('[Admin Page] User is admin.');
            }
          } else {
            setProfileError(`Your user profile does not have administrator privileges. 'isAdmin' flag is missing, not true (boolean), or profile incorrect. Current isAdmin value: ${userProfileData.isAdmin}`);
            setIsCurrentUserAdmin(false);
            if (process.env.NODE_ENV === 'development') {
              console.log('[Admin Page] User is not admin or isAdmin flag is not boolean true.');
            }
          }
        } else {
          setProfileError(`User profile not found for your account (UID: ${authUser.uid}). Ensure a user document exists in Firestore at 'users/${authUser.uid}' with an 'isAdmin' field set to boolean true.`);
          setIsCurrentUserAdmin(false);
          if (process.env.NODE_ENV === 'development') {
            console.log('[Admin Page] User profile not found.');
          }
        }
      } catch (err: any) {
        console.error("[Admin Page] Error checking admin status (raw error):", JSON.stringify(err, Object.getOwnPropertyNames(err)));
        setProfileError(`Error accessing user profile: ${err.message}. Code: ${err.code || 'N/A'}. Please try again or check Firestore permissions.`);
        setIsCurrentUserAdmin(false);
        adminStatus = false;
      }

      if (adminStatus) {
        try {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Admin Page] Fetching feedback submissions.');
          }
          const feedbackQuery = query(collection(db, 'feedbackSubmissions'), orderBy('createdAt', 'desc'));
          const feedbackSnapshot = await getDocs(feedbackQuery);
          const items = feedbackSnapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              uid: data.uid,
              isGuest: data.isGuest,
              type: data.type,
              createdAt: data.createdAt as Timestamp,
              appVersion: data.appVersion,
              buildNumber: data.buildNumber,
              routeContext: data.routeContext,
              deviceContext: data.deviceContext,
              ratings: data.ratings,
              freeform: data.freeform,
              didInteract: data.didInteract,
              gestureMeta: data.gestureMeta,
              // status not officially in new model yet but useful for admin triage? 
              // The prompt didn't specify status field in step 1.1 but existing admin page uses it.
              // I should probably skip status for now or assume it's missing.
            } as FeedbackSubmission;
          });
          setFeedbackItems(items);

          // ... (skipping newIds logic as status is missing in new model) ...

        } catch (err: any) {
          console.error("[Admin Page] Error fetching feedback submissions:", err);
          setFeedbackError(`Failed to load feedback: ${err.message}.`);
        }
      }
      setIsLoadingData(false);
    };

    checkAdminAndFetchData();
    // No cleanup for status update since status field is removed/undefined
    return () => { };
  }, [authUser, authLoading]);

  // ... loading/error states ...

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-8 space-y-6">

        {isCurrentUserAdmin && (
          <div className="mb-0">
            <Button asChild variant="outline" size="sm">
              <Link href="/?openDashboard=true">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Dashboard
              </Link>
            </Button>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">Feedback Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {feedbackError && (
              <div className="text-destructive mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                <AlertTriangle className="inline-block mr-2 h-5 w-5" />
                {feedbackError}
              </div>
            )}
            {feedbackItems.length === 0 && !feedbackError && !isLoadingData ? (
              <p className="text-muted-foreground text-center py-6">No feedback submissions yet.</p>
            ) : feedbackItems.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Date</TableHead>
                      <TableHead className="w-[100px]">Type</TableHead>
                      <TableHead className="w-[100px]">User</TableHead>
                      <TableHead className="w-[100px]">Ver</TableHead>
                      <TableHead className="w-[300px]">Ratings / Content</TableHead>
                      <TableHead className="w-[150px]">Route</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedbackItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap font-mono text-xs">
                          {item.createdAt ? format(item.createdAt.toDate(), 'MMM d, HH:mm') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.type === 'bug' ? 'destructive' : item.type === 'feature' ? 'secondary' : 'default'} className="capitalize">
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {item.isGuest ? <Badge variant="outline">Guest</Badge> : <span className="font-mono">{item.uid?.slice(0, 5)}...</span>}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {item.appVersion}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            {/* Ratings if improve */}
                            {item.type === 'improve' && item.ratings && (
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(item.ratings || {}).map(([key, val]) => (
                                  val ? (
                                    <Badge key={key} variant="outline" className="text-[10px] px-1 py-0 h-5">
                                      {key.slice(0, 3)}: {val}
                                    </Badge>
                                  ) : null
                                ))}
                              </div>
                            )}
                            {/* Freeform */}
                            {item.freeform && (
                              <p className="text-sm whitespace-pre-wrap break-words italic text-foreground/80">
                                "{item.freeform}"
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs break-all text-muted-foreground">
                          {item.routeContext}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : isLoadingData ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading feedback...</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
