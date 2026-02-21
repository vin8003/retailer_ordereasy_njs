"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Star, FileText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { orderService } from "@/services/api";
import { Badge } from "@/components/ui/badge";

interface Review {
    id: number;
    order_number: string;
    rating: number;
    customer_name: string;
    comment: string;
    created_at: string;
}

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        try {
            setIsLoading(true);
            const response = await orderService.getRetailerReviews();
            setReviews(response.data.results || response.data || []);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch reviews:", err);
            setError("Failed to load reviews. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading reviews...</div>;
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customer Reviews</h1>
                    <p className="text-muted-foreground">
                        View feedback left by your customers on their orders.
                    </p>
                </div>
            </div>

            {reviews.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                        <Star className="h-12 w-12 mb-4 text-muted-foreground/30" />
                        <h3 className="text-lg font-medium text-foreground mb-1">No reviews yet</h3>
                        <p>When customers leave a rating on their order, it will appear here.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {reviews.map((review) => (
                        <Card key={review.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3 border-b bg-muted/30">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg font-semibold">{review.customer_name}</CardTitle>
                                        <CardDescription className="text-xs mt-1">
                                            {format(new Date(review.created_at), "MMM d, yyyy 'at' h:mm a")}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline" className="font-mono text-xs">
                                        #{review.order_number}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-1 mb-3">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={16}
                                            className={review.rating >= star ? 'text-yellow-400' : 'text-gray-300'}
                                            fill={review.rating >= star ? '#facc15' : 'none'}
                                        />
                                    ))}
                                    <span className="ml-2 text-sm font-semibold text-muted-foreground">
                                        {review.rating}.0
                                    </span>
                                </div>

                                {review.comment ? (
                                    <div className="mt-2 text-sm text-foreground bg-muted/50 p-3 rounded-md relative italic">
                                        <FileText className="h-3 w-3 absolute top-2 right-2 text-muted-foreground/40" />
                                        "{review.comment}"
                                    </div>
                                ) : (
                                    <p className="mt-2 text-sm text-muted-foreground italic">No comment provided.</p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
