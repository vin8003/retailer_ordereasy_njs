import { Star, StarHalf } from 'lucide-react';

interface Review {
    customer_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

interface RecentReviewsProps {
    reviews: Review[];
    isLoading: boolean;
}

const RecentReviews = ({ reviews, isLoading }: RecentReviewsProps) => {
    if (isLoading) {
        return <div className="text-center py-10">Loading reviews...</div>;
    }

    if (reviews.length === 0) {
        return (
            <div className="bg-card rounded-lg border shadow-sm p-6 text-center text-muted-foreground">
                No reviews yet
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recent Reviews</h3>
            {reviews.map((review, index) => (
                <div key={index} className="bg-card rounded-lg border shadow-sm p-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="font-medium">{review.customer_name || 'Anonymous'}</div>
                            <div className="flex items-center gap-1 mt-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        size={14}
                                        className={`${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-foreground/80">{review.comment}</p>
                </div>
            ))}
        </div>
    );
};

export default RecentReviews;
