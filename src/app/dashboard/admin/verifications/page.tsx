'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Store,
  MapPin,
  Phone,
  Mail,
  User as UserIcon,
  Calendar,
  AlertTriangle,
  Loader2,
  RefreshCw,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

import { adminService, authService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface RetailerVerificationItem {
  id: number;
  user_id: number | null;
  username: string;
  email: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  shop_name: string;
  shop_description: string;
  shop_image: string | null;
  contact_email: string;
  contact_phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  business_type: string;
  gst_number: string;
  pan_number: string;
  is_verified: boolean;
  verification_status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string;
  is_active: boolean;
  created_at: string;
}

interface VerificationCounts {
  pending: number;
  approved: number;
  rejected: number;
  all: number;
}

export default function AdminVerificationsPage() {
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [retailers, setRetailers] = useState<RetailerVerificationItem[]>([]);
  const [counts, setCounts] = useState<VerificationCounts>({
    pending: 0,
    approved: 0,
    rejected: 0,
    all: 0,
  });

  // Action state
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [selectedRetailerForReject, setSelectedRetailerForReject] = useState<RetailerVerificationItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // 1. Check Admin Permission
  useEffect(() => {
    let isMounted = true;
    const verifyAdmin = async () => {
      try {
        const res = await authService.fetchAuthProfile();
        if (isMounted) {
          if (res.data?.is_admin) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        }
      } catch (err) {
        if (isMounted) setIsAdmin(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    verifyAdmin();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Verifications
  const loadVerifications = async (status: string = activeTab, search: string = searchQuery) => {
    setDataLoading(true);
    try {
      const res = await adminService.fetchVerifications({
        status,
        search: search.trim() || undefined,
      });
      if (res.data) {
        setRetailers(res.data.results || []);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
      }
    } catch (err: any) {
      console.error('Failed to load verifications', err);
      toast.error(err.response?.data?.error || 'Failed to fetch verifications');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadVerifications(activeTab, searchQuery);
    }
  }, [isAdmin, activeTab]);

  // Handle Search on Enter or debounce
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadVerifications(activeTab, searchQuery);
  };

  // 3. Approve Action
  const handleApprove = async (retailer: RetailerVerificationItem) => {
    setActionInProgress(retailer.id);
    try {
      const res = await adminService.verifyAction(retailer.id, { action: 'approve' });
      toast.success(res.data?.message || `${retailer.shop_name} approved successfully!`);
      // Refresh list
      loadVerifications(activeTab, searchQuery);
    } catch (err: any) {
      console.error('Failed to approve retailer', err);
      toast.error(err.response?.data?.error || 'Failed to approve retailer');
    } finally {
      setActionInProgress(null);
    }
  };

  // 4. Reject Action
  const handleRejectSubmit = async () => {
    if (!selectedRetailerForReject) return;
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }

    setActionInProgress(selectedRetailerForReject.id);
    try {
      const res = await adminService.verifyAction(selectedRetailerForReject.id, {
        action: 'reject',
        reason: rejectReason.trim(),
      });
      toast.success(res.data?.message || `${selectedRetailerForReject.shop_name} rejected.`);
      setSelectedRetailerForReject(null);
      setRejectReason('');
      loadVerifications(activeTab, searchQuery);
    } catch (err: any) {
      console.error('Failed to reject retailer', err);
      toast.error(err.response?.data?.error || 'Failed to reject retailer');
    } finally {
      setActionInProgress(null);
    }
  };

  // Status Badge Component
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1 px-2.5 py-0.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1 px-2.5 py-0.5">
            <XCircle className="h-3.5 w-3.5" /> Rejected
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200 gap-1 px-2.5 py-0.5">
            <Clock className="h-3.5 w-3.5" /> Pending Review
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Non-admin Access Denied View
  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="rounded-full bg-red-100 p-4 text-red-600 dark:bg-red-950 dark:text-red-400">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Access Restricted</h2>
        <p className="text-muted-foreground max-w-md">
          You do not have administrative privileges to access the verification panel.
        </p>
        <Button onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Retailer Verifications</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Review new retailer signups, approve genuine stores, or reject with a reason.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadVerifications(activeTab, searchQuery)}
          disabled={dataLoading}
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as any)}
          className="w-full md:w-auto"
        >
          <TabsList className="grid grid-cols-4 w-full md:w-auto">
            <TabsTrigger value="pending" className="gap-1.5 text-xs sm:text-sm">
              Pending
              {counts.pending > 0 && (
                <span className="ml-1 rounded-full bg-amber-500 text-white text-[10px] px-1.5 py-0.2 font-bold">
                  {counts.pending}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-1.5 text-xs sm:text-sm">
              Approved
              <span className="text-xs text-muted-foreground">({counts.approved})</span>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-1.5 text-xs sm:text-sm">
              Rejected
              <span className="text-xs text-muted-foreground">({counts.rejected})</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-1.5 text-xs sm:text-sm">
              All
              <span className="text-xs text-muted-foreground">({counts.all})</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by shop, name, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </form>
      </div>

      {/* Retailers List */}
      {dataLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : retailers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Store className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <h3 className="font-semibold text-lg">No retailers found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {activeTab === 'pending'
                ? 'Great job! There are currently no pending retailer verification requests.'
                : 'No retailers match the selected filter.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {retailers.map((retailer) => {
            const isPending = retailer.verification_status === 'pending';
            const isProcessing = actionInProgress === retailer.id;

            return (
              <Card
                key={retailer.id}
                data-testid="verification-card"
                data-username={retailer.username}
                className={`transition-all hover:shadow-md ${
                  isPending
                    ? 'border-amber-300/80 bg-amber-50/10 dark:border-amber-900/60'
                    : ''
                }`}
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Retailer Info */}
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                          <Store className="h-5 w-5 text-primary" />
                          {retailer.shop_name}
                        </h3>
                        {renderStatusBadge(retailer.verification_status)}
                        {retailer.business_type && (
                          <Badge variant="outline" className="text-xs uppercase font-semibold">
                            {retailer.business_type}
                          </Badge>
                        )}
                      </div>

                      {/* Owner & Contact details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                          <span className="truncate font-medium text-foreground">
                            {retailer.first_name || retailer.last_name
                              ? `${retailer.first_name} ${retailer.last_name}`.trim()
                              : retailer.username}
                          </span>
                          <span className="text-xs text-muted-foreground">(@{retailer.username})</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                          <span className="truncate">{retailer.phone_number || retailer.contact_phone || 'No phone'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                          <span className="truncate">{retailer.email || retailer.contact_email || 'No email'}</span>
                        </div>

                        <div className="flex items-center gap-2 sm:col-span-2">
                          <MapPin className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                          <span className="truncate">
                            {[retailer.address_line1, retailer.city, retailer.state, retailer.pincode]
                              .filter(Boolean)
                              .join(', ') || 'No address specified'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                          <span>Joined {new Date(retailer.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Rejection reason (if rejected) */}
                      {retailer.verification_status === 'rejected' && retailer.rejection_reason && (
                        <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900/40">
                          <span className="font-semibold">Rejection Reason:</span> {retailer.rejection_reason}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-row sm:flex-col lg:flex-row items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0">
                      {isPending ? (
                        <>
                          <Button
                            data-testid="verification-approve"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 flex-1 sm:flex-none"
                            onClick={() => handleApprove(retailer)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-1.5 flex-1 sm:flex-none"
                            onClick={() => {
                              setSelectedRetailerForReject(retailer);
                              setRejectReason('');
                            }}
                            disabled={isProcessing}
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                        </>
                      ) : retailer.verification_status === 'rejected' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 gap-1.5"
                          onClick={() => handleApprove(retailer)}
                          disabled={isProcessing}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Re-approve
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 gap-1.5"
                          onClick={() => {
                            setSelectedRetailerForReject(retailer);
                            setRejectReason('');
                          }}
                          disabled={isProcessing}
                        >
                          <XCircle className="h-4 w-4" />
                          Revoke Approval
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reject Modal Dialog */}
      <Dialog
        open={Boolean(selectedRetailerForReject)}
        onOpenChange={(open) => !open && setSelectedRetailerForReject(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" /> Reject Retailer Verification
            </DialogTitle>
            <DialogDescription>
              Please enter the reason for rejecting{' '}
              <strong className="text-foreground">{selectedRetailerForReject?.shop_name}</strong>.
              This reason will be displayed on the retailer's dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="reject-reason">Rejection Reason</Label>
            <Textarea
              id="reject-reason"
              placeholder="e.g. Incomplete shop address, unverified phone number, or invalid GST/PAN details..."
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSelectedRetailerForReject(null)}
              disabled={Boolean(actionInProgress)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={Boolean(actionInProgress)}
              className="gap-2"
            >
              {actionInProgress ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
