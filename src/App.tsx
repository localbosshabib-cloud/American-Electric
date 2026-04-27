import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { 
  Search, MapPin, Package, User, ShoppingCart, Zap, Box, Layers, 
  ZapOff, Lightbulb, Settings, ShieldCheck, Truck, BadgePercent, 
  Headphones, ChevronRight, ChevronUp, Filter, ArrowLeft, Plus, Minus, 
  FileText, CheckCircle2, AlertCircle, Info, ArrowLeftRight, X,
  CreditCard, Phone, Mail, Menu, Star, Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Product {
  id: string;
  name: string;
  manufacturer: string;
  partNumber: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  specs: Record<string, string>;
  image: string;
  rating: number;
  reviewCount: number;
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const CartContext = React.createContext<{
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  cartCount: number;
  cartTotal: number;
}>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  cartCount: 0,
  cartTotal: 0,
});

const useCart = () => React.useContext(CartContext);

const ComparisonContext = React.createContext<{
  comparisonList: Product[];
  addToComparison: (product: Product) => void;
  removeFromComparison: (productId: string) => void;
  clearComparison: () => void;
  isInComparison: (productId: string) => boolean;
}>({
  comparisonList: [],
  addToComparison: () => {},
  removeFromComparison: () => {},
  clearComparison: () => {},
  isInComparison: () => false,
});

const useComparison = () => React.useContext(ComparisonContext);

const WishlistContext = React.createContext<{
  wishlist: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}>({
  wishlist: [],
  addToWishlist: () => {},
  removeFromWishlist: () => {},
  isInWishlist: () => false,
  clearWishlist: () => {},
});

const useWishlist = () => React.useContext(WishlistContext);

// --- Smooth Scrolling Helpers ---
const slugify = (text: string) => text.toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^\w-]+/g, '')
  .replace(/--+/g, '-')
  .replace(/^-+/, '')
  .replace(/-+$/, '');

const unslugifyManufacturer = (slug: string) => 
  manufacturers.find(m => slugify(m) === slug) || decodeURIComponent(slug);

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pathname, hash]);

  return null;
}

const useSmoothScroll = () => {
  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return { scrollToId };
};

// --- Mock Data ---
const categories = [
  { id: 'breakers', name: 'Circuit Breakers', icon: <Zap className="w-6 h-6" />, count: '8,400+ Products' },
  { id: 'panelboards', name: 'Panelboards', icon: <Box className="w-6 h-6" />, count: 'Stock & Custom' },
  { id: 'conduit', name: 'Conduit & Fittings', icon: <Layers className="w-6 h-6" />, count: 'Bulk Discounts' },
  { id: 'transformers', name: 'Transformers', icon: <ZapOff className="w-6 h-6" />, count: 'Dry-Type & Liquid' },
  { id: 'lighting', name: 'LED Lighting', icon: <Lightbulb className="w-6 h-6" />, count: 'Commercial Grade' },
  { id: 'controls', name: 'Industrial Controls', icon: <Settings className="w-6 h-6" />, count: 'VFDs & Starters' },
  { id: 'wire', name: 'Wire & Cable', icon: <Zap className="w-6 h-6" />, count: 'All Gauges In-Stock' },
  { id: 'safety', name: 'Safety Switches', icon: <ShieldCheck className="w-6 h-6" />, count: 'Fusible & Non-Fusible' },
];

const manufacturers = [
  'Siemens Energy',
  'Schneider Electric',
  'ABB Industrial',
  'Eaton Corporation',
  'Leviton Controls',
  'Hubbell Wiring',
];

const products: Product[] = [
  {
    id: 'p1',
    name: 'QO 20 Amp Single-Pole Circuit Breaker',
    manufacturer: 'Schneider Electric',
    partNumber: 'QO120',
    category: 'breakers',
    price: 12.99,
    stock: 450,
    description: 'The Square D by Schneider Electric QO 20 Amp Single-Pole Circuit Breaker is intended for overload and short-circuit protection of your electrical system.',
    specs: { Amperage: '20A', Voltage: '120V', Poles: '1', Type: 'Standard' },
    image: 'https://picsum.photos/seed/circuit-breaker/400/400',
    rating: 4.8,
    reviewCount: 124
  },
  {
    id: 'p2',
    name: 'Siemens 100 Amp 20-Space 20-Circuit Main Breaker Load Center',
    manufacturer: 'Siemens Energy',
    partNumber: 'P2020B1100CU',
    category: 'panelboards',
    price: 189.50,
    stock: 25,
    description: 'Siemens PL Series Load Centers are the ultimate in load center features and value. Designed for long-term reliability.',
    specs: { Amperage: '100A', Spaces: '20', Circuits: '20', Material: 'Copper Bus' },
    image: 'https://picsum.photos/seed/electrical-panel/400/400',
    rating: 4.6,
    reviewCount: 42
  },
  {
    id: 'p3',
    name: '3/4 in. EMT Conduit - 10 ft. Bundle',
    manufacturer: 'Generic Industrial',
    partNumber: 'EMT-75-10',
    category: 'conduit',
    price: 85.00,
    stock: 1200,
    description: 'High-quality galvanized steel EMT conduit for commercial and industrial electrical wiring protection.',
    specs: { Size: '3/4 inch', Length: '10 ft', Material: 'Galvanized Steel' },
    image: 'https://picsum.photos/seed/conduit/400/400',
    rating: 4.9,
    reviewCount: 89
  },
  {
    id: 'p4',
    name: 'Eaton 45kVA Dry Type Transformer',
    manufacturer: 'Eaton Corporation',
    partNumber: 'V48M28T45EE',
    category: 'transformers',
    price: 3450.00,
    stock: 5,
    description: 'Energy-efficient dry-type transformer designed for commercial and industrial power distribution.',
    specs: { Capacity: '45kVA', Phase: '3-Phase', Input: '480V', Output: '208Y/120V' },
    image: 'https://picsum.photos/seed/transformer/400/400',
    rating: 4.7,
    reviewCount: 15
  },
  {
    id: 'p5',
    name: 'Leviton Decora Smart Wi-Fi Dimmer',
    manufacturer: 'Leviton Controls',
    partNumber: 'DW6HD-1BZ',
    category: 'controls',
    price: 44.99,
    stock: 85,
    description: 'Control your lights from anywhere using the My Leviton app or voice commands with Alexa or Google Assistant.',
    specs: { Protocol: 'Wi-Fi', Load: '600W Incandescent', Compatibility: 'Universal' },
    image: 'https://picsum.photos/seed/dimmer/400/400',
    rating: 4.5,
    reviewCount: 210
  },
  {
    id: 'p6',
    name: 'THHN 12 AWG Stranded Wire - 500 ft. Spool',
    manufacturer: 'Southwire',
    partNumber: 'THHN-12-RED',
    category: 'wire',
    price: 115.00,
    stock: 300,
    description: 'General purpose building wire for services, feeders, and branch circuits in residential, commercial, and industrial applications.',
    specs: { Gauge: '12 AWG', Type: 'THHN/THWN-2', Length: '500 ft', Color: 'Red' },
    image: 'https://picsum.photos/seed/wire1/400/400',
    rating: 4.9,
    reviewCount: 340
  },
  {
    id: 'p7',
    name: 'Lithonia Lighting 2x4 LED Flat Panel',
    manufacturer: 'Lithonia Lighting',
    partNumber: 'CPX-2X4-4000LM',
    category: 'lighting',
    price: 79.99,
    stock: 150,
    description: 'The CPX series LED flat panel from Lithonia Lighting is the perfect choice for a quality LED panel at an affordable price.',
    specs: { Size: '2x4', Lumens: '4000', Color: '4000K', Voltage: '120-277V' },
    image: 'https://picsum.photos/seed/light1/400/400',
    rating: 4.4,
    reviewCount: 56
  },
  {
    id: 'p8',
    name: 'Heavy Duty Safety Switch 60A 3-Pole',
    manufacturer: 'ABB Industrial',
    partNumber: 'OT60F3',
    category: 'safety',
    price: 145.00,
    stock: 45,
    description: 'Heavy duty safety switch designed for industrial applications requiring reliable power disconnection.',
    specs: { Amperage: '60A', Poles: '3', Enclosure: 'NEMA 1', Type: 'Non-Fusible' },
    image: 'https://picsum.photos/seed/safety1/400/400',
    rating: 4.7,
    reviewCount: 28
  },
  {
    id: 'p9',
    name: 'Square D 200 Amp Main Breaker Load Center',
    manufacturer: 'Schneider Electric',
    partNumber: 'HOM4080M200PC',
    category: 'panelboards',
    price: 245.00,
    stock: 15,
    description: 'Homeline 200 Amp 40-Space 80-Circuit Indoor Main Breaker Load Center with Cover.',
    specs: { Amperage: '200A', Spaces: '40', Circuits: '80', Bus: 'Aluminum' },
    image: 'https://picsum.photos/seed/panel2/400/400',
    rating: 4.8,
    reviewCount: 75
  },
  {
    id: 'p10',
    name: '1/2 in. EMT Conduit - 10 ft. Bundle',
    manufacturer: 'Generic Industrial',
    partNumber: 'EMT-50-10',
    category: 'conduit',
    price: 65.00,
    stock: 2000,
    description: 'Standard 1/2 inch EMT conduit for residential and light commercial wiring.',
    specs: { Size: '1/2 inch', Length: '10 ft', Material: 'Galvanized Steel' },
    image: 'https://picsum.photos/seed/conduit2/400/400',
    rating: 4.8,
    reviewCount: 150
  }
];

const mockReviews: Record<string, Review[]> = {
  'p1': [
    { id: 'r1', userName: 'Mike T.', rating: 5, date: '2024-03-10', comment: 'Standard QO quality. Snaps in perfectly, never had a dud.', verified: true },
    { id: 'r2', userName: 'Dave S.', rating: 4, date: '2024-02-15', comment: 'Good price for bulk orders. Delivery was fast.', verified: true }
  ],
  'p5': [
    { id: 'r3', userName: 'Sarah L.', rating: 5, date: '2024-03-01', comment: 'Easy to set up with the app. Works great with Alexa.', verified: true },
    { id: 'r4', userName: 'James K.', rating: 3, date: '2024-01-20', comment: 'A bit bulky in the box, but functionality is solid.', verified: false }
  ]
};

// --- Components ---

function QuoteModal({ product }: { product?: Product }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      toast.success("Quote request submitted!", {
        description: "A sales representative will contact you within 2 hours."
      });
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant={product ? "outline" : "default"} className={product ? "w-full" : "bg-safety-orange hover:bg-safety-orange/90 text-white font-bold text-xs uppercase px-4.5 h-10 rounded-md"}>
              {product ? "Request Bulk Quote" : "Request Quote"}
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs font-bold">{product ? "Get Custom Pricing for this Item" : "Request a Custom Project Quote"}</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request a B2B Quote</DialogTitle>
          <DialogDescription>
            {product 
              ? `Get wholesale pricing for ${product.name}`
              : "Tell us what you need for your project and our team will get back to you with a custom quote."}
          </DialogDescription>
        </DialogHeader>
        
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center"
            >
              <CheckCircle2 className="w-10 h-10" />
            </motion.div>
            <h3 className="text-xl font-bold text-navy">Request Received!</h3>
            <p className="text-slate-500">Your reference number is #QT-{Math.floor(Math.random() * 10000)}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input id="company" placeholder="ACME Electric" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input id="email" type="email" placeholder="john@acme.com" required />
            </div>
            {product && (
              <div className="space-y-2">
                <Label htmlFor="qty">Estimated Quantity</Label>
                <Input id="qty" type="number" placeholder="e.g. 50" required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="message">Project Details / Additional Parts</Label>
              <textarea 
                id="message" 
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="List any other parts or project requirements here..."
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full bg-navy text-white hover:bg-navy/90">Submit Quote Request</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StarRating({ rating, size = 16 }: { rating: number, size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star 
          key={star} 
          size={size} 
          className={`${star <= Math.round(rating) ? 'fill-safety-orange text-safety-orange' : 'text-slate-200 fill-slate-200'}`} 
        />
      ))}
    </div>
  );
}

function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>(mockReviews[productId] || []);
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : "0.0";

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => Math.round(r.rating) === star).length;
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    return { star, count, percentage };
  });

  const handleSubmit = () => {
    if (newRating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (newComment.trim().length < 5) {
      toast.error("Comment must be at least 5 characters long");
      return;
    }

    const newReview: Review = {
      id: `r${Date.now()}`,
      userName: "Verified Contractor",
      rating: newRating,
      date: new Date().toISOString().split('T')[0],
      comment: newComment,
      verified: true
    };

    setReviews([newReview, ...reviews]);
    setNewRating(0);
    setNewComment("");
    setShowForm(false);
    toast.success("Review submitted!", { description: "Thank you for your valuable feedback." });
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Rating Summary */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-navy">Customer Reviews</h3>
          <div className="flex items-center gap-3">
            <div className="text-4xl font-black text-navy">{averageRating}</div>
            <div>
              <StarRating rating={parseFloat(averageRating)} size={18} />
              <div className="text-xs text-slate-500 font-medium">{reviews.length} total reviews</div>
            </div>
          </div>
          
          <div className="space-y-2">
            {ratingDistribution.map(({ star, percentage }) => (
              <div key={star} className="flex items-center gap-3 text-sm">
                <span className="w-12 text-slate-500 font-medium">{star} stars</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className="h-full bg-safety-orange"
                  />
                </div>
                <span className="w-8 text-right text-slate-400 text-xs">{Math.round(percentage)}%</span>
              </div>
            ))}
          </div>

          <Button 
            variant="outline" 
            className="w-full border-navy text-navy font-bold hover:bg-navy/5"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel Review" : "Write a Review"}
          </Button>
        </div>

        {/* Review List & Form */}
        <div className="md:col-span-2 space-y-8">
          <AnimatePresence>
            {showForm && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6 mb-8">
                  <h4 className="font-bold text-navy text-lg">Leave your feedback</h4>
                  
                  <div className="space-y-3">
                    <Label className="text-navy font-bold">How would you rate this product?</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button 
                          key={s} 
                          onMouseEnter={() => setHoverRating(s)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setNewRating(s)}
                          className="transition-transform active:scale-95"
                        >
                          <Star 
                            className={`w-8 h-8 ${
                              (hoverRating || newRating) >= s 
                                ? 'fill-safety-orange text-safety-orange' 
                                : 'text-slate-300'
                            }`} 
                          />
                        </button>
                      ))}
                      {newRating > 0 && (
                        <span className="ml-3 text-sm font-bold text-navy flex items-center">
                          {newRating === 5 ? 'Excellent' : newRating === 4 ? 'Good' : newRating === 3 ? 'Average' : newRating === 2 ? 'Poor' : 'Awful'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-navy font-bold">Tell us more</Label>
                    <textarea 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full min-h-[120px] p-4 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-electric-blue/20 text-sm"
                      placeholder="Was the installation easy? How is the build quality? Share your professional opinion with other contractors."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={() => setShowForm(false)} className="font-bold">Discard</Button>
                    <Button 
                      className="bg-navy text-white hover:bg-navy/90 font-bold px-8" 
                      onClick={handleSubmit}
                    >
                      Post Review
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            {reviews.length > 0 ? reviews.map((review, idx) => (
              <motion.div 
                key={review.id} 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white border border-slate-100 p-6 rounded-xl hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                {review.verified && (
                  <div className="absolute top-0 right-0 p-1 bg-green-500 text-white rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-bold text-navy leading-none">{review.userName}</span>
                      {review.verified && (
                        <Badge className="bg-green-50 text-green-700 border-green-100 text-[10px] font-bold uppercase py-0.5 px-2">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} size={14} />
                      <span className="text-xs text-slate-400 font-medium">{review.date}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  "{review.comment}"
                </p>
                
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  <span>Helpful?</span>
                  <button className="hover:text-electric-blue transition-colors">Yes (12)</button>
                  <button className="hover:text-red-500 transition-colors">No (0)</button>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Star className="w-8 h-8 text-slate-200" />
                </div>
                <h4 className="text-lg font-bold text-navy mb-2">No reviews yet</h4>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">
                  Be the first professional to review this product and help other contractors make informed decisions.
                </p>
                <Button 
                  variant="link" 
                  className="text-electric-blue font-bold mt-4"
                  onClick={() => setShowForm(true)}
                >
                  Write the first review
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();
  const { addToComparison, removeFromComparison, isInComparison } = useComparison();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, qty);
    toast.success(`${qty} x ${product.name} added to cart!`, {
      description: "Items successfully added to your wholesale order.",
      icon: <ShoppingCart className="w-4 h-4" />
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/product/${product.id}`);
    }
  };

  const handleCompare = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (isInComparison(product.id)) {
      removeFromComparison(product.id);
    } else {
      addToComparison(product);
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const isComparing = isInComparison(product.id);
  const isWishlisted = isInWishlist(product.id);

  return (
    <Card 
      className="group cursor-pointer hover:shadow-xl hover:scale-[1.015] transition-all duration-300 border-slate-200 overflow-hidden flex flex-col h-full relative focus-visible:ring-2 focus-visible:ring-electric-blue outline-none"
      onClick={() => navigate(`/product/${product.id}`)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${product.name}`}
    >
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
        />
        <Badge className="absolute top-2 right-2 bg-white/90 text-navy border-none font-bold">
          In Stock
        </Badge>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={handleCompare}
              onKeyDown={(e) => e.stopPropagation()}
              className={`absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center transition-all z-20 ${
                isComparing ? 'bg-safety-orange text-white' : 'bg-white/80 text-navy hover:bg-white'
              } shadow-sm focus-visible:ring-2 focus-visible:ring-safety-orange outline-none`}
              aria-label={isComparing ? "Remove from comparison" : "Add to comparison"}
              aria-pressed={isComparing}
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="text-xs font-bold">{isComparing ? "Remove from comparison" : "Add to comparison"}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={handleWishlist}
              className={`absolute top-12 left-2 w-8 h-8 rounded-full flex items-center justify-center transition-all z-20 ${
                isWishlisted ? 'bg-red-500 text-white' : 'bg-white/80 text-navy hover:bg-white'
              } shadow-sm focus-visible:ring-2 focus-visible:ring-red-500 outline-none`}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={isWishlisted}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="text-xs font-bold">{isWishlisted ? "Remove from wishlist" : "Add to wishlist"}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <CardContent className="p-4 flex-1 flex flex-col gap-1">
        <p 
          className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-electric-blue cursor-pointer transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/manufacturer/${slugify(product.manufacturer)}`);
          }}
        >
          {product.manufacturer}
        </p>
        <h3 className="text-sm font-bold text-navy line-clamp-2 min-h-[40px]">{product.name}</h3>
        <div className="flex items-center gap-2 mb-1">
          <StarRating rating={product.rating} size={12} />
          <span className="text-[10px] font-bold text-slate-400">({product.reviewCount})</span>
        </div>
        <p className="text-xs text-slate-500 font-mono">PN: {product.partNumber}</p>
        
        <div className="mt-2 text-lg font-extrabold text-navy">
          ${product.price.toLocaleString()}
        </div>

        <div className="mt-auto pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center border border-slate-200 rounded-md bg-white flex-1 h-9">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="p-1.5 hover:bg-slate-50 disabled:opacity-30 focus-visible:bg-slate-100 outline-none" 
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    onKeyDown={(e) => e.stopPropagation()}
                    disabled={qty <= 1}
                    aria-label="Decrease quantity"
                  >
                    <span className="sr-only">Decrease quantity</span>
                    <Minus className="w-3 h-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-[10px] font-bold">Decrease</p>
                </TooltipContent>
              </Tooltip>
              <Input 
                type="number" 
                value={qty} 
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-full border-none text-center focus-visible:ring-0 h-7 text-xs px-1"
                aria-label="Quantity"
                min="1"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="p-1.5 hover:bg-slate-50 focus-visible:bg-slate-100 outline-none" 
                    onClick={() => setQty(qty + 1)}
                    onKeyDown={(e) => e.stopPropagation()}
                    aria-label="Increase quantity"
                  >
                    <span className="sr-only">Increase quantity</span>
                    <Plus className="w-3 h-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-[10px] font-bold">Increase</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  className="bg-navy text-white hover:bg-navy/90 h-9 px-3 font-bold text-xs"
                  onClick={handleAddToCart}
                  onKeyDown={(e) => e.stopPropagation()}
                  aria-label={`Add ${product.name} to cart`}
                >
                  <ShoppingCart className="w-3 h-3 mr-1.5" /> Add
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-[10px] font-bold">Add to Wholesale Order</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-electric-blue hover:text-electric-blue hover:bg-electric-blue/5 p-0 h-auto font-bold text-[11px] w-fit"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/product/${product.id}`);
            }}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState('');

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/categories?search=${encodeURIComponent(heroSearch)}`);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Professional B2B Hero Section */}
      <section className="relative bg-[#0F172A] min-h-[500px] lg:min-h-[600px] flex items-center overflow-hidden border-b border-slate-800">
        {/* Background Pattern & Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=2000" 
            alt="Industrial Electrical Components" 
            className="w-full h-full object-cover opacity-20 mix-blend-luminosity"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/95 to-transparent" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Centered Content */}
            <div className="lg:col-span-12 space-y-8 lg:space-y-10 text-center flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-safety-orange/10 border border-safety-orange/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-safety-orange opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-safety-orange"></span>
                  </span>
                  <span className="text-[10px] font-bold text-safety-orange uppercase tracking-widest">Live Inventory: 48,290+ Items</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                  Built for Contractors Who <br />
                  <span className="text-safety-orange tracking-tighter">Can’t Afford Delays</span>
                </h1>
                
                <p className="text-base lg:text-lg text-slate-400 max-w-xl leading-relaxed">
                  Deep inventory, same-day dispatch, and expert support to keep your projects moving.
                </p>
              </motion.div>

              {/* Quick Action Search */}
              <motion.form 
                onSubmit={handleHeroSearch}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white p-2 rounded-xl shadow-2xl flex flex-col md:flex-row gap-2 max-w-2xl"
              >
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder="Fast lookup by Part #, SKU or Application..." 
                    className="w-full h-14 pl-12 pr-4 text-navy font-medium placeholder:text-slate-400 border-none focus:ring-0 rounded-lg"
                  />
                </div>
                <Button 
                  type="submit"
                  className="h-14 px-8 bg-navy text-white hover:bg-navy/90 font-bold rounded-lg shrink-0"
                >
                  Find Components
                </Button>
              </motion.form>

              {/* Trust Logos */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="pt-4 space-y-4"
              >
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Tier-1 Strategic Manufacturer Network</p>
                <div className="flex flex-wrap items-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                  <span className="text-xl font-black text-white tracking-tighter">SIEMENS</span>
                  <span className="text-xl font-black text-white tracking-tighter">SCHNEIDER</span>
                  <span className="text-xl font-black text-white tracking-tighter">EATON</span>
                  <span className="text-xl font-black text-white tracking-tighter">ABB</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Deals */}
      <section className="p-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <BadgePercent className="w-8 h-8 text-safety-orange" />
            <div>
              <h2 className="text-2xl font-black text-navy tracking-tight uppercase">Recommended Deals for you</h2>
              <p className="text-sm text-slate-500 font-medium">Exclusive contractor pricing on high-volume essentials.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.slice(0, 4).map(product => (
              <motion.div 
                whileHover={{ y: -5 }}
                key={`deal-${product.id}`}
                className="relative group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all"
              >
                <div className="absolute top-3 left-3 z-10">
                  <Badge className="bg-red-500 text-white border-none font-bold text-[10px] px-2 py-1">
                    SAVE {Math.floor(Math.random() * 15 + 10)}%
                  </Badge>
                </div>
                <div className="aspect-square bg-slate-50 relative overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-navy/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button 
                      size="sm" 
                      className="bg-white text-navy hover:bg-slate-100 font-bold"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      Quick View
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <div 
                    className="text-[10px] font-bold text-slate-400 uppercase mb-1 hover:text-electric-blue cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/manufacturer/${slugify(product.manufacturer)}`);
                    }}
                  >
                    {product.manufacturer}
                  </div>
                  <h3 className="font-bold text-navy text-sm line-clamp-1 mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-lg font-black text-navy">${(product.price * 0.85).toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400 line-through font-bold">${product.price.toFixed(2)}</span>
                    </div>
                    <Button size="icon" variant="ghost" className="text-electric-blue hover:bg-electric-blue/5">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section id="featured-products" className="p-8 bg-white">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-lg font-bold text-navy">Featured Products</h2>
          <Link to="/categories" className="text-[13px] text-electric-blue font-semibold hover:underline">
            Browse All
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {products.map(product => (
            <div key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="p-8 flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <h2 className="text-lg font-bold text-navy">Shop by Category</h2>
          <Link to="/categories" className="text-[13px] text-electric-blue font-semibold hover:underline">
            View All Categories
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Card 
              key={cat.id} 
              className="group cursor-pointer hover:shadow-md transition-all border-slate-200 hover:border-electric-blue/30 focus-visible:ring-2 focus-visible:ring-electric-blue outline-none"
              onClick={() => navigate(`/category/${cat.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/category/${cat.id}`);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`View category: ${cat.name}`}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-navy group-hover:bg-electric-blue/5 transition-colors">
                  {cat.icon}
                </div>
                <h4 className="text-sm font-bold text-navy">{cat.name}</h4>
                <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                  {cat.count}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      
      {/* Explore Trusted Brands */}
      <section className="p-8 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-2xl font-black text-navy tracking-tight uppercase">Explore Trusted Brands</h2>
              <p className="text-sm text-slate-500 font-medium">Direct partnerships with industry leading manufacturers.</p>
            </div>
            <Button 
                variant="outline" 
                className="h-10 font-bold border-slate-200 text-navy hover:bg-slate-50"
                onClick={() => navigate('/manufacturers')}
            >
              View All Partners <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {manufacturers.map((brand, i) => (
              <motion.div 
                key={brand}
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate(`/categories?manufacturer=${slugify(brand)}`)}
                className="group p-6 bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-4 hover:shadow-lg hover:border-electric-blue/20 transition-all cursor-pointer"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-electric-blue group-hover:text-white transition-colors duration-300">
                  <span className="text-2xl font-black">{brand.charAt(0)}</span>
                </div>
                <span className="text-[11px] font-black text-navy uppercase tracking-tighter text-center">
                  {brand}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Semantic Linking: Knowledge Base & Guides */}
      <section className="p-8 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-1.5 h-6 bg-electric-blue rounded-full" />
            <h2 className="text-xl font-black text-navy tracking-tight uppercase">Professional Contractor Guides</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: "Choosing the Right Circuit Breaker", 
                desc: "A comprehensive guide on panel compatibility and amperage requirements for modern commercial builds.",
                linkText: "Shop Breakers & Panels",
                categoryRef: "breakers"
              },
              { 
                title: "Lighting Control Systems 101", 
                desc: "How to implement smart switches and dimmers in large-scale residential projects for maximum efficiency.",
                linkText: "Explore Switches & Controls",
                categoryRef: "automation"
              },
              { 
                title: "Wire Gauge & Load Calculations", 
                desc: "Essential safety reference for determining the correct conductor size based on distance and load.",
                linkText: "View Wire & Cable Catalog",
                categoryRef: "wire"
              }
            ].map((guide, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-navy mb-2">{guide.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{guide.desc}</p>
                </div>
                <Link 
                  to={`/category/${guide.categoryRef}`} 
                  className="text-[11px] font-black text-safety-orange uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform"
                >
                  {guide.linkText} <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}


function SearchResultsPage() {
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const q = queryParams.get('q') || '';
  const navigate = useNavigate();

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(q.toLowerCase()) || 
    p.partNumber.toLowerCase().includes(q.toLowerCase()) ||
    p.manufacturer.toLowerCase().includes(q.toLowerCase()) ||
    p.description.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
        <Link to="/" className="hover:text-electric-blue">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-navy font-semibold">Search Results</span>
      </div>

      <div className="mb-10">
        <h1 className="text-3xl font-black text-navy tracking-tight uppercase mb-2">
          Results for "{q}"
        </h1>
        <p className="text-slate-500 font-medium">
          We found {filteredProducts.length} items matching your search.
        </p>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Search className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-navy mb-2">No matching products</h3>
          <p className="text-slate-500 text-center max-w-md mb-8">
            We couldn't find anything matching "{q}". Try checking your spelling or using more general terms.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
                className="bg-navy text-white hover:bg-navy/90 font-bold"
                onClick={() => navigate('/categories')}
            >
              Browse All Categories
            </Button>
            <Button 
                variant="outline"
                className="font-bold border-slate-200 h-12"
                onClick={() => navigate('/contact')}
            >
              Contact Sales Support
            </Button>
          </div>
        </div>
      )}

      {/* Recommended for you if no results */}
      {filteredProducts.length === 0 && (
        <div className="mt-20">
          <h2 className="text-xl font-black text-navy mb-8 uppercase tracking-tight">You might also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.slice(0, 4).map(product => (
              <div key={`rec-${product.id}`}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const manufacturerSlug = queryParams.get('manufacturer');

  const category = categories.find(c => c.id === id);
  const baseProducts = id ? products.filter(p => p.category === id) : products;

  // Filter States
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    if (manufacturerSlug) {
      const actualName = unslugifyManufacturer(manufacturerSlug);
      if (actualName) {
        setSelectedManufacturers([actualName]);
      }
    }
  }, [manufacturerSlug]);

  // Derived Data
  const availableManufacturers = Array.from(new Set(baseProducts.map(p => p.manufacturer)));
  
  const filteredProducts = baseProducts.filter(product => {
    // Manufacturer Filter
    if (selectedManufacturers.length > 0 && !selectedManufacturers.includes(product.manufacturer)) {
      return false;
    }
    // Price Filter
    if (minPrice !== '' && product.price < minPrice) return false;
    if (maxPrice !== '' && product.price > maxPrice) return false;
    // Stock Filter
    if (onlyInStock && product.stock <= 0) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0; // featured
  });

  const toggleManufacturer = (m: string) => {
    setSelectedManufacturers(prev => 
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
  };

  const clearFilters = () => {
    setSelectedManufacturers([]);
    setMinPrice('');
    setMaxPrice('');
    setOnlyInStock(false);
  };

  const activeFilterCount = 
    selectedManufacturers.length + 
    (minPrice !== '' || maxPrice !== '' ? 1 : 0) + 
    (onlyInStock ? 1 : 0);

  const FilterSection = () => (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-navy text-sm uppercase tracking-wider">Manufacturer</h3>
          {selectedManufacturers.length > 0 && (
            <button 
              onClick={() => setSelectedManufacturers([])}
              className="text-[10px] font-bold text-electric-blue hover:underline"
            >
              Clear
            </button>
          )}
        </div>
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
          {availableManufacturers.map(m => (
            <label key={m} className="flex items-center gap-3 cursor-pointer group">
              <div 
                className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                  selectedManufacturers.includes(m) 
                    ? 'bg-electric-blue border-electric-blue text-white' 
                    : 'border-slate-300 group-hover:border-electric-blue bg-white'
                }`}
                onClick={() => toggleManufacturer(m)}
              >
                {selectedManufacturers.includes(m) && <CheckCircle2 className="w-3 h-3" />}
              </div>
              <span className={`text-sm ${selectedManufacturers.includes(m) ? 'text-navy font-bold' : 'text-slate-600'}`}>
                {m}
              </span>
            </label>
          ))}
        </div>
      </div>

      <Separator className="bg-slate-100" />

      <div>
        <h3 className="font-bold text-navy text-sm uppercase tracking-wider mb-4">Price Range</h3>
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">$</span>
            <Input 
              type="number" 
              placeholder="Min" 
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
              className="pl-6 h-9 text-xs border-slate-200 focus-visible:ring-electric-blue/20 bg-slate-50/50"
            />
          </div>
          <div className="w-2 h-px bg-slate-300 shrink-0" />
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">$</span>
            <Input 
              type="number" 
              placeholder="Max" 
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
              className="pl-6 h-9 text-xs border-slate-200 focus-visible:ring-electric-blue/20 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Quick select presets */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Under $100', min: 0, max: 100 },
            { label: '$100 - $500', min: 100, max: 500 },
            { label: '$500 - $1k', min: 500, max: 1000 },
            { label: '$1k+', min: 1000, max: '' }
          ].map((range, i) => (
            <button
              key={i}
              onClick={() => {
                setMinPrice(range.min);
                setMaxPrice(range.max as any);
              }}
              className={`text-[10px] font-bold px-2 py-1.5 rounded-md border transition-all text-center ${
                minPrice === range.min && maxPrice === range.max
                  ? 'bg-navy text-white border-navy shadow-sm'
                  : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <Separator className="bg-slate-100" />

      <div>
        <h3 className="font-bold text-navy text-sm uppercase tracking-wider mb-4">Availability</h3>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div 
            className={`w-10 h-5 rounded-full transition-colors relative ${
              onlyInStock ? 'bg-electric-blue' : 'bg-slate-200'
            }`}
            onClick={() => setOnlyInStock(!onlyInStock)}
          >
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
              onlyInStock ? 'left-6' : 'left-1'
            }`} />
          </div>
          <span className="text-sm text-slate-600 font-medium">In Stock Only</span>
        </label>
      </div>

      {activeFilterCount > 0 && (
        <Button 
          variant="outline" 
          className="w-full h-10 text-xs font-bold border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={clearFilters}
        >
          Reset All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Breadcrumbs paths={[
        { name: "Categories", link: "/categories" },
        { name: category?.name || 'All Products' }
      ]} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-navy tracking-tight uppercase">
            {category ? category.name : "All Products"}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className="bg-electric-blue/10 text-electric-blue border-none font-bold">
              {filteredProducts.length} Results
            </Badge>
            {activeFilterCount > 0 && (
              <span className="text-xs text-slate-400 font-medium italic">
                ({activeFilterCount} active filters)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden flex-1 flex items-center gap-2 h-10 font-bold border-slate-200">
                <Filter className="w-4 h-4 text-safety-orange" /> Filters
                {activeFilterCount > 0 && <span className="bg-safety-orange text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center">{activeFilterCount}</span>}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] border-r border-slate-100">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-navy font-black text-xl uppercase tracking-tighter">Product Filters</SheetTitle>
              </SheetHeader>
              <div className="pr-2">
                <FilterSection />
              </div>
            </SheetContent>
          </Sheet>

          <div className="relative group flex-1 md:flex-none">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-48 h-10 pl-4 pr-10 bg-white border border-slate-200 rounded-lg text-xs font-bold text-navy appearance-none focus:outline-none focus:ring-2 focus:ring-electric-blue/20 cursor-pointer"
            >
              <option value="featured">Featured First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex gap-10">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-24 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-black text-navy mb-6 uppercase tracking-tighter flex items-center gap-2">
              <Filter className="w-5 h-5 text-safety-orange" /> Shop Filters
            </h2>
            <FilterSection />
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={product.id}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">No results found</h3>
              <p className="text-slate-500 text-center max-w-xs mb-8">
                Try adjusting your filters or search terms to find what you're looking for.
              </p>
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="font-bold text-electric-blue border-electric-blue/20 hover:bg-electric-blue/5"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Breadcrumbs({ paths }: { paths: { name: string, link?: string }[] }) {
  return (
    <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6" aria-label="Breadcrumb">
      <Link to="/" className="hover:text-electric-blue transition-colors flex items-center gap-1.5 shrink-0">
        <div className="w-4 h-4 bg-navy flex items-center justify-center rounded">
          <Zap className="w-2.5 h-2.5 text-white" />
        </div>
        Home
      </Link>
      {paths.map((path, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
          {path.link ? (
            <Link to={path.link} className="hover:text-electric-blue transition-colors whitespace-nowrap">
              {path.name}
            </Link>
          ) : (
            <span className="text-navy font-black line-clamp-1">{path.name}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

function ProductDetailPage() {
  const { id } = useParams();
  const product = products.find(p => p.id === id);
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  if (!product) {
    return (
      <div className="p-20 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-navy">Product Not Found</h2>
        <Link to="/" className="text-electric-blue hover:underline mt-4 block">Return to Catalog</Link>
      </div>
    );
  }

  const category = categories.find(c => c.id === product.category);
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    addToCart(product, qty);
    toast.success(`${qty} x ${product.name} added to cart!`, {
      description: "Items successfully added to your wholesale order.",
      icon: <ShoppingCart className="w-4 h-4" />
    });
  };

  const isWishlisted = isInWishlist(product.id);

  const handleWishlist = () => {
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Breadcrumbs paths={[
        { name: "Categories", link: "/categories" },
        { name: category?.name || product.category, link: `/category/${product.category}` },
        { name: product.name }
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white p-8 rounded-2xl border border-slate-200 mb-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-square bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:border-electric-blue transition-colors">
                <img src={`https://picsum.photos/seed/thumb${i}${product.id}/100/100`} alt="thumb" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-6">
          <div>
            <Link to={`/manufacturer/${slugify(product.manufacturer)}`}>
              <Badge className="bg-slate-100 text-slate-600 border-none mb-2 cursor-pointer hover:bg-slate-200 transition-colors">{product.manufacturer}</Badge>
            </Link>
            <h1 className="text-3xl font-extrabold text-navy mb-2">{product.name}</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-500">Part #: <span className="font-mono text-navy">{product.partNumber}</span></span>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <StarRating rating={product.rating} />
                <span className="font-bold text-navy">{product.rating}</span>
                <span className="text-slate-400">({product.reviewCount} reviews)</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-green-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> In Stock ({product.stock} units)
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-black text-navy">${product.price.toLocaleString()}</span>
              <span className="text-slate-500 text-sm">/ each</span>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-slate-200 rounded-md bg-white">
                  <button 
                    className="p-2 hover:bg-slate-50 disabled:opacity-30" 
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    disabled={qty <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <Input 
                    type="number" 
                    value={qty} 
                    onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                    className="w-16 border-none text-center focus-visible:ring-0 h-8"
                  />
                  <button 
                    className="p-2 hover:bg-slate-50" 
                    onClick={() => setQty(qty + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <Button 
                  className="flex-1 bg-navy text-white hover:bg-navy/90 h-11 font-bold"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
                </Button>
                <Button 
                  variant="outline"
                  size="icon"
                  className={`h-11 w-11 shrink-0 ${isWishlisted ? 'bg-red-50 text-red-500 border-red-200' : 'text-slate-400 border-slate-200'}`}
                  onClick={handleWishlist}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </Button>
              </div>
              <QuoteModal product={product} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-navy flex items-center gap-2">
              <Info className="w-4 h-4 text-electric-blue" /> Product Description
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-navy flex items-center gap-2">
              <Settings className="w-4 h-4 text-electric-blue" /> Technical Specifications
            </h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              {Object.entries(product.specs).map(([key, value]) => (
                <React.Fragment key={key}>
                  <span className="text-slate-500">{key}</span>
                  <span className="text-navy font-semibold">{value}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Internal Linking Strategy: Frequently Bought Together & Pairs Well With */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-6 bg-safety-orange rounded-full" />
            <h3 className="text-xl font-black text-navy tracking-tight">Frequently Bought Together</h3>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-20 h-20 bg-slate-50 rounded-lg flex-shrink-0 border border-slate-100 overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <Plus className="w-5 h-5 text-slate-300 flex-shrink-0" />
              {relatedProducts.slice(0, 1).map(p => (
                <Link key={p.id} to={`/product/${p.id}`} className="flex items-center gap-4 group">
                  <div className="w-20 h-20 bg-slate-50 rounded-lg border border-slate-100 group-hover:border-electric-blue transition-colors overflow-hidden">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                </Link>
              ))}
            </div>
            <div className="w-full md:w-auto p-4 bg-slate-50 rounded-xl border border-slate-100 min-w-[200px]">
              <div className="text-xs font-bold text-slate-400 uppercase mb-2">Bundle Price</div>
              <div className="text-2xl font-black text-navy mb-4">
                ${(product.price * 1.8).toLocaleString()}
              </div>
              <Button className="w-full bg-electric-blue text-white hover:bg-electric-blue/90 font-bold text-xs uppercase h-10">
                Add Bundle to Cart
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-navy p-8 rounded-2xl text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
            <Package className="w-5 h-5 text-safety-orange" /> Pairs Well With
          </h3>
          <div className="space-y-4 relative z-10">
            {relatedProducts.slice(1, 3).map(p => (
              <Link 
                key={p.id} 
                to={`/product/${p.id}`} 
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors border border-white/5 mb-3"
              >
                <div className="w-12 h-12 bg-white/10 rounded-lg overflow-hidden shrink-0">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h4 className="text-xs font-bold line-clamp-1 group-hover:text-safety-orange transition-colors">{p.name}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">${p.price}</p>
                </div>
              </Link>
            ))}
            <Link to={`/category/${product.category}`} className="block text-center text-xs font-bold text-slate-400 hover:text-white transition-colors pt-2 border-t border-white/10">
              View All {category?.name || "Accessory"} Options
            </Link>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12 bg-white p-8 rounded-2xl border border-slate-200">
        <ProductReviews productId={product.id} />
      </div>
    </div>
  );
}

function CategoriesPage() {
  const navigate = useNavigate();

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-electric-blue">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-navy font-semibold">All Categories</span>
      </div>

      <h1 className="text-3xl font-extrabold text-navy mb-8 tracking-tight">Browse by Category</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <Card 
            key={cat.id} 
            className="group cursor-pointer hover:shadow-lg transition-all border-slate-200 hover:border-electric-blue/30 overflow-hidden"
            onClick={() => navigate(`/category/${cat.id}`)}
          >
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-navy group-hover:bg-electric-blue/5 transition-colors">
                {React.cloneElement(cat.icon as React.ReactElement, { className: "w-10 h-10" })}
              </div>
              <div>
                <h4 className="text-lg font-bold text-navy mb-1">{cat.name}</h4>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  {cat.count}
                </span>
              </div>
              <Button variant="ghost" className="text-electric-blue font-bold group-hover:underline p-0">
                View Products →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-electric-blue">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-navy font-semibold">Shopping Cart</span>
      </div>

      <h1 className="text-3xl font-extrabold text-navy mb-8 tracking-tight">Your Wholesale Order</h1>

      {cart.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-20 text-center">
          <ShoppingCart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy mb-2">Your cart is empty</h2>
          <p className="text-slate-500 mb-6">Looks like you haven't added any electrical supplies yet.</p>
          <Button className="bg-navy text-white hover:bg-navy/90 font-bold px-8" onClick={() => navigate('/categories')}>
            Start Shopping
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-4">
            {cart.map((item) => (
              <Card key={item.product.id} className="border-slate-200 overflow-hidden">
                <CardContent className="p-4 flex gap-4">
                  <div className="w-24 h-24 bg-slate-50 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.product.manufacturer}</p>
                        <h3 className="font-bold text-navy hover:text-electric-blue cursor-pointer" onClick={() => navigate(`/product/${item.product.id}`)}>
                          {item.product.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono">PN: {item.product.partNumber}</p>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <ZapOff className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="flex items-center border border-slate-200 rounded-md bg-white">
                        <button 
                          className="p-1.5 hover:bg-slate-50 disabled:opacity-30" 
                          onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <Input 
                          type="number" 
                          value={item.quantity} 
                          onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                          className="w-12 border-none text-center focus-visible:ring-0 h-7 text-xs px-1"
                        />
                        <button 
                          className="p-1.5 hover:bg-slate-50" 
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">${item.product.price.toLocaleString()} each</p>
                        <p className="font-bold text-navy">${(item.product.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card className="border-slate-200 bg-slate-50/50">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-bold text-navy">${cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Estimated Shipping</span>
                  <span className="text-green-600 font-bold">FREE</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tax</span>
                  <span className="text-slate-400 italic">Calculated at checkout</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-black">
                  <span className="text-navy">Total</span>
                  <span className="text-navy">${cartTotal.toLocaleString()}</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button 
                  className="w-full bg-safety-orange hover:bg-safety-orange/90 text-white font-bold h-12 text-lg shadow-lg shadow-safety-orange/20"
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout
                </Button>
                <p className="text-[10px] text-center text-slate-500 px-4">
                  By proceeding, you agree to American Electrics's B2B Terms of Service.
                </p>
              </CardFooter>
            </Card>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-navy">Secure B2B Transaction</h4>
                <p className="text-[10px] text-slate-500">Your data is protected by industry-standard encryption.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckoutPage() {
  const { cartTotal, cart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateShipping = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.address.trim()) newErrors.address = 'Street address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = 'Invalid ZIP code format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToPayment = () => {
    if (validateShipping()) {
      setStep(2);
    } else {
      toast.error("Please fix the errors in the form", {
        description: "All required shipping fields must be valid."
      });
    }
  };

  if (cart.length === 0) {
    return (
      <div className="p-20 text-center">
        <ShoppingCart className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-navy">Your cart is empty</h2>
        <Button className="mt-4 bg-navy text-white" onClick={() => navigate('/categories')}>Go Shopping</Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
        <Link to="/cart" className="hover:text-electric-blue">Cart</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-navy font-semibold">Checkout</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">
        <div className="space-y-8">
          {/* Steps */}
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= s ? 'bg-navy text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {s}
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${step >= s ? 'text-navy' : 'text-slate-400'}`}>
                  {s === 1 ? 'Shipping' : s === 2 ? 'Payment' : 'Review'}
                </span>
                {s < 3 && <div className="w-8 h-[2px] bg-slate-200 mx-2" />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-extrabold text-navy">Shipping Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={errors.firstName ? "text-red-500" : ""}>First Name</Label>
                  <Input 
                    placeholder="John" 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className={errors.firstName ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.firstName && <p className="text-[10px] font-bold text-red-500 uppercase">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label className={errors.lastName ? "text-red-500" : ""}>Last Name</Label>
                  <Input 
                    placeholder="Doe" 
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className={errors.lastName ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.lastName && <p className="text-[10px] font-bold text-red-500 uppercase">{errors.lastName}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Company Name (Optional)</Label>
                <Input 
                  placeholder="ACME Electric" 
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className={errors.address ? "text-red-500" : ""}>Street Address</Label>
                <Input 
                  placeholder="123 Industrial Way" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className={errors.address ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.address && <p className="text-[10px] font-bold text-red-500 uppercase">{errors.address}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className={errors.city ? "text-red-500" : ""}>City</Label>
                  <Input 
                    placeholder="Los Angeles" 
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className={errors.city ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.city && <p className="text-[10px] font-bold text-red-500 uppercase">{errors.city}</p>}
                </div>
                <div className="space-y-2">
                  <Label className={errors.state ? "text-red-500" : ""}>State</Label>
                  <Input 
                    placeholder="CA" 
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    className={errors.state ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.state && <p className="text-[10px] font-bold text-red-500 uppercase">{errors.state}</p>}
                </div>
                <div className="space-y-2">
                  <Label className={errors.zipCode ? "text-red-500" : ""}>ZIP Code</Label>
                  <Input 
                    placeholder="90001" 
                    value={formData.zipCode}
                    onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                    className={errors.zipCode ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.zipCode && <p className="text-[10px] font-bold text-red-500 uppercase">{errors.zipCode}</p>}
                </div>
              </div>
              <Button className="w-full bg-navy text-white h-12 font-bold" onClick={handleContinueToPayment}>
                Continue to Payment
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-extrabold text-navy">Payment Method</h2>
              <div className="space-y-4">
                <div className="p-4 border-2 border-navy rounded-xl bg-navy/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 bg-slate-800 rounded flex items-center justify-center text-[8px] text-white font-bold">VISA</div>
                    <div>
                      <p className="text-sm font-bold text-navy">Visa ending in 4242</p>
                      <p className="text-xs text-slate-500">Expires 12/26</p>
                    </div>
                  </div>
                  <div className="w-4 h-4 rounded-full border-4 border-navy" />
                </div>
                <div className="p-4 border border-slate-200 rounded-xl flex items-center justify-between opacity-50 cursor-not-allowed">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 bg-slate-100 rounded flex items-center justify-center text-[8px] text-slate-400 font-bold">NET 30</div>
                    <div>
                      <p className="text-sm font-bold text-slate-400">Net 30 Terms</p>
                      <p className="text-xs text-slate-400">Requires Credit Approval</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-[2] bg-navy text-white h-12 font-bold" onClick={() => setStep(3)}>
                  Review Order
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-extrabold text-navy">Review & Place Order</h2>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Shipping To</h4>
                    <p className="text-sm text-navy font-medium">John Doe</p>
                    <p className="text-sm text-slate-500">123 Industrial Way, Los Angeles, CA 90001</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-electric-blue font-bold" onClick={() => setStep(1)}>Edit</Button>
                </div>
                <Separator />
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Payment</h4>
                    <p className="text-sm text-navy font-medium">Visa ending in 4242</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-electric-blue font-bold" onClick={() => setStep(2)}>Edit</Button>
                </div>
              </div>
              <Button className="w-full bg-safety-orange hover:bg-safety-orange/90 text-white h-14 text-xl font-black shadow-xl shadow-safety-orange/20" onClick={() => {
                toast.success("Order Placed Successfully!", {
                  description: "Your order #ORD-12345 has been received."
                });
                navigate('/account');
              }}>
                Place Order — ${cartTotal.toLocaleString()}
              </Button>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="p-4">
              <CardTitle className="text-sm">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Items ({cart.length})</span>
                <span className="font-bold text-navy">${cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Shipping</span>
                <span className="text-green-600 font-bold">FREE</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span className="text-navy">Total</span>
                <span className="text-navy">${cartTotal.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function AddressModal({ 
  address, 
  onSave, 
  trigger 
}: { 
  address?: any, 
  onSave: (data: any) => void,
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: address?.name || '',
    type: address?.type || 'Shipping',
    street: address?.address?.split(',')[0] || '',
    city: address?.address?.split(',')[1]?.trim() || '',
    state: address?.address?.split(',')[2]?.trim()?.split(' ')[0] || '',
    zipCode: address?.address?.split(',')[2]?.trim()?.split(' ')[1] || '',
    primary: address?.primary || false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Label/Name is required';
    if (!formData.street.trim()) newErrors.street = 'Street address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = 'Invalid ZIP code format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
      setOpen(false);
      toast.success(address ? "Address updated" : "Address added", {
        description: "Your address book has been updated successfully."
      });
    } else {
      toast.error("Please fix the errors", {
        description: "Check the highlighted fields."
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{address ? 'Edit Address' : 'Add New Address'}</DialogTitle>
          <DialogDescription>
            Enter the details for your saved address.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className={errors.name ? "text-red-500" : ""}>Address Label (e.g. Job Site A)</Label>
            <Input 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
              placeholder="e.g. Main Office"
            />
            {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase">{errors.name}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Address Type</Label>
              <select 
                className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="Shipping">Shipping</option>
                <option value="Billing">Billing</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-8">
              <input 
                type="checkbox" 
                id="primary"
                checked={formData.primary}
                onChange={(e) => setFormData({...formData, primary: e.target.checked})}
                className="w-4 h-4 rounded border-slate-300 text-navy focus:ring-navy"
              />
              <Label htmlFor="primary" className="cursor-pointer">Set as Primary</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label className={errors.street ? "text-red-500" : ""}>Street Address</Label>
            <Input 
              value={formData.street}
              onChange={(e) => setFormData({...formData, street: e.target.value})}
              className={errors.street ? "border-red-500 focus-visible:ring-red-500" : ""}
              placeholder="123 Industrial Way"
            />
            {errors.street && <p className="text-[10px] font-bold text-red-500 uppercase">{errors.street}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className={errors.city ? "text-red-500" : ""}>City</Label>
              <Input 
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className={errors.city ? "border-red-500 focus-visible:ring-red-500" : ""}
                placeholder="Los Angeles"
              />
              {errors.city && <p className="text-[10px] font-bold text-red-500 uppercase">{errors.city}</p>}
            </div>
            <div className="space-y-2">
              <Label className={errors.state ? "text-red-500" : ""}>State</Label>
              <Input 
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
                className={errors.state ? "border-red-500 focus-visible:ring-red-500" : ""}
                placeholder="CA"
              />
              {errors.state && <p className="text-[10px] font-bold text-red-500 uppercase">{errors.state}</p>}
            </div>
            <div className="space-y-2">
              <Label className={errors.zipCode ? "text-red-500" : ""}>ZIP Code</Label>
              <Input 
                value={formData.zipCode}
                onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                className={errors.zipCode ? "border-red-500 focus-visible:ring-red-500" : ""}
                placeholder="90001"
              />
              {errors.zipCode && <p className="text-[10px] font-bold text-red-500 uppercase">{errors.zipCode}</p>}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-navy text-white font-bold">Save Address</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AccountPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Default to true for demo purposes, as before
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses'>('orders');

  const mockOrders = [
    { id: 'ORD-99281', date: '2024-03-15', status: 'Delivered', total: 1240.50, items: 3 },
    { id: 'ORD-99104', date: '2024-02-28', status: 'Processing', total: 450.00, items: 1 },
    { id: 'ORD-98952', date: '2024-01-12', status: 'Shipped', total: 2100.25, items: 12 },
  ];

  const mockAddresses = [
    { id: 1, type: 'Billing', name: 'Habib Electrical Services', address: '123 Industrial Way, Los Angeles, CA 90001', primary: true },
    { id: 2, type: 'Shipping', name: 'Job Site A', address: '456 Construction Rd, Santa Monica, CA 90401', primary: false },
  ];

  if (!isLoggedIn) {
    return (
      <div className="p-8 max-w-lg mx-auto py-16">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-8 bg-navy text-white text-center">
            <div className="w-16 h-16 bg-safety-orange rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight uppercase mb-2">
              {authMode === 'login' ? 'Contractor Login' : 'New Contractor Account'}
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              {authMode === 'login' 
                ? 'Access your wholesale account and active quotes.' 
                : 'Register to unlock B2B pricing and net-term billing.'}
            </p>
          </div>

          <div className="p-8 space-y-6">
            {authMode === 'register' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">First Name</Label>
                  <Input placeholder="John" className="h-11 border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Last Name</Label>
                  <Input placeholder="Doe" className="h-11 border-slate-200" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</Label>
              <Input type="email" placeholder="john@doe-electrical.com" className="h-11 border-slate-200" />
            </div>

            {authMode === 'register' && (
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Company Name</Label>
                <Input placeholder="Doe Electrical Services Inc." className="h-11 border-slate-200" />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</Label>
              <Input type="password" placeholder="••••••••" className="h-11 border-slate-200" />
            </div>

            {authMode === 'register' && (
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Contractor License # (Optional)</Label>
                <Input placeholder="C-10 ######" className="h-11 border-slate-200" />
              </div>
            )}

            <Button 
                className="w-full h-12 bg-safety-orange text-white hover:bg-safety-orange/90 font-black uppercase tracking-widest mt-4"
                onClick={() => {
                  setIsLoggedIn(true);
                  toast.success(authMode === 'login' ? 'Welcome back, Habib!' : 'Account created successfully!');
                }}
            >
              {authMode === 'login' ? 'Sign In' : 'Create Contractor Account'}
            </Button>

            <div className="text-center pt-4">
              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-sm font-bold text-electric-blue hover:underline"
              >
                {authMode === 'login' 
                  ? "Don't have an account? Create one" 
                  : "Already have an account? Sign In"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Secured Enterprise Access</p>
            <div className="flex justify-center gap-4 opacity-50 grayscale">
                <span className="text-xs font-black text-navy tracking-tighter">SIEMENS TRUSTED</span>
                <span className="text-xs font-black text-navy tracking-tighter">AES VERIFIED</span>
                <span className="text-xs font-black text-navy tracking-tighter">CSA CERTIFIED</span>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-electric-blue">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-navy font-semibold">My Account</span>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center text-white font-bold text-xl mb-3">
                H
              </div>
              <h2 className="font-bold text-navy">Habib Electrical</h2>
              <p className="text-xs text-slate-500">localbosshabib@gmail.com</p>
            </div>
            <nav className="p-2">
              <button 
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === 'orders' ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Package className="w-4 h-4" /> Order History
              </button>
              <button 
                onClick={() => setActiveTab('addresses')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === 'addresses' ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <MapPin className="w-4 h-4" /> Saved Addresses
              </button>
              <button 
                onClick={() => setIsLoggedIn(false)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-red-500 hover:bg-red-50 transition-colors mt-4"
              >
                <ZapOff className="w-4 h-4" /> Sign Out
              </button>
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'orders' ? (
            <div className="space-y-6">
              <h1 className="text-2xl font-extrabold text-navy tracking-tight">Order History</h1>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Total</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mockOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-navy">{order.id}</td>
                        <td className="px-6 py-4 text-slate-600">{order.date}</td>
                        <td className="px-6 py-4">
                          <Badge className={`font-bold text-[10px] ${
                            order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                            order.status === 'Processing' ? 'bg-blue-100 text-blue-700' : 
                            'bg-orange-100 text-orange-700'
                          } border-none`}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 font-bold text-navy">${order.total.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" className="text-electric-blue font-bold">View Details</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-extrabold text-navy tracking-tight">Saved Addresses</h1>
                <AddressModal 
                  onSave={(data) => console.log('New Address:', data)}
                  trigger={
                    <Button className="bg-navy text-white hover:bg-navy/90 font-bold">
                      <Plus className="w-4 h-4 mr-2" /> Add New
                    </Button>
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockAddresses.map(addr => (
                  <div key={addr.id} className="bg-white p-6 rounded-xl border border-slate-200 relative group">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] uppercase">
                        {addr.type}
                      </Badge>
                      {addr.primary && (
                        <span className="text-[10px] font-bold text-electric-blue uppercase">Primary</span>
                      )}
                    </div>
                    <h3 className="font-bold text-navy mb-1">{addr.name}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{addr.address}</p>
                    <div className="mt-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <AddressModal 
                        address={addr}
                        onSave={(data) => console.log('Updated Address:', data)}
                        trigger={
                          <Button variant="outline" size="sm" className="text-xs font-bold">Edit</Button>
                        }
                      />
                      <Button variant="ghost" size="sm" className="text-xs font-bold text-red-500">Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BulkOrderModal() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([{ id: 1, partNumber: '', qty: '' }]);
  const [submitted, setSubmitted] = useState(false);

  const addRow = () => {
    setRows([...rows, { id: Date.now(), partNumber: '', qty: '' }]);
  };

  const removeRow = (id: number) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const updateRow = (id: number, field: 'partNumber' | 'qty', value: string) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      setRows([{ id: 1, partNumber: '', qty: '' }]);
      toast.success("Bulk order request submitted!", {
        description: "Our procurement team will verify stock and send a pro-forma invoice."
      });
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 text-xs font-bold uppercase border-none">
              Bulk Order
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs font-bold">Upload or List Multiple Parts</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Quick Bulk Order Form</DialogTitle>
          <DialogDescription>
            Enter multiple part numbers and quantities for a rapid wholesale quote.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center"
            >
              <CheckCircle2 className="w-10 h-10" />
            </motion.div>
            <h3 className="text-xl font-bold text-navy">Bulk Request Received!</h3>
            <p className="text-slate-500">We are processing your list now.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input placeholder="Your Name" required />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input placeholder="Company Name" required />
              </div>
            </div>

            <div className="space-y-3">
              <div className="hidden sm:grid grid-cols-[1fr_100px_40px] gap-4 px-1 text-[10px] font-bold text-slate-400 uppercase">
                <span>Part Number / SKU</span>
                <span>Quantity</span>
                <span></span>
              </div>
              <ScrollArea className="max-h-[300px] pr-4">
                <div className="space-y-3">
                  {rows.map((row) => (
                    <div key={row.id} className="grid grid-cols-1 sm:grid-cols-[1fr_100px_40px] gap-4 items-center border-b sm:border-none pb-4 sm:pb-0">
                      <div className="space-y-1 sm:space-y-0">
                        <Label className="sm:hidden text-[10px] font-bold text-slate-400 uppercase">Part Number / SKU</Label>
                        <Input 
                          placeholder="e.g. QO120" 
                          value={row.partNumber}
                          onChange={(e) => updateRow(row.id, 'partNumber', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1 sm:space-y-0">
                        <Label className="sm:hidden text-[10px] font-bold text-slate-400 uppercase">Quantity</Label>
                        <Input 
                          type="number" 
                          placeholder="Qty" 
                          value={row.qty}
                          onChange={(e) => updateRow(row.id, 'qty', e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="text-slate-400 hover:text-red-500"
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length <= 1}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full border-dashed border-slate-300 text-slate-500 hover:text-navy hover:border-navy"
                onClick={addRow}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Another Item
              </Button>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 text-[11px] text-slate-500 flex items-center gap-2">
                <Info className="w-4 h-4 text-electric-blue shrink-0" />
                Next-day delivery available for all stock items in LA.
              </div>
              <Button type="submit" className="bg-navy text-white hover:bg-navy/90 px-8">
                Submit Bulk Order
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ComparisonPage() {
  const { comparisonList, removeFromComparison, clearComparison } = useComparison();
  const navigate = useNavigate();

  // Get all unique spec keys across all products in comparison
  const allSpecKeys: string[] = Array.from(
    new Set(comparisonList.flatMap(p => Object.keys(p.specs)))
  );

  if (comparisonList.length === 0) {
    return (
      <div className="p-20 text-center">
        <ArrowLeftRight className="w-16 h-16 text-slate-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-navy mb-2">Comparison list is empty</h2>
        <p className="text-slate-500 mb-6">Add products to compare their specifications side-by-side.</p>
        <Button className="bg-navy text-white hover:bg-navy/90 font-bold px-8" onClick={() => navigate('/categories')}>
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-electric-blue">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-navy font-semibold">Product Comparison</span>
      </div>

      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-navy tracking-tight">Compare Products</h1>
          <p className="text-slate-500">Comparing {comparisonList.length} items</p>
        </div>
        <Button variant="outline" size="sm" onClick={clearComparison} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100">
          Clear All
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="p-6 w-64 bg-slate-50/50"></th>
              {comparisonList.map(product => (
                <th key={product.id} className="p-6 min-w-[250px] relative group">
                  <button 
                    onClick={() => removeFromComparison(product.id)}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex flex-col items-center text-center gap-3">
                    <img src={product.image} alt={product.name} className="w-32 h-32 object-cover rounded-lg border border-slate-100" referrerPolicy="no-referrer" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{product.manufacturer}</p>
                      <h3 className="text-sm font-bold text-navy line-clamp-2 h-10">{product.name}</h3>
                      <p className="text-lg font-black text-navy mt-2">${product.price.toLocaleString()}</p>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full bg-navy text-white hover:bg-navy/90 font-bold"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      View Product
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-50">
              <td className="p-4 px-6 font-bold text-xs text-slate-400 uppercase bg-slate-50/30">Part Number</td>
              {comparisonList.map(product => (
                <td key={product.id} className="p-4 px-6 text-sm font-mono text-navy">{product.partNumber}</td>
              ))}
            </tr>
            <tr className="border-b border-slate-50">
              <td className="p-4 px-6 font-bold text-xs text-slate-400 uppercase bg-slate-50/30">Availability</td>
              {comparisonList.map(product => (
                <td key={product.id} className="p-4 px-6 text-sm">
                  <Badge className="bg-green-100 text-green-700 border-none font-bold text-[10px]">In Stock</Badge>
                </td>
              ))}
            </tr>
            {allSpecKeys.map(key => (
              <tr key={key} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                <td className="p-4 px-6 font-bold text-xs text-slate-400 uppercase bg-slate-50/30">{key}</td>
                {comparisonList.map(product => (
                  <td key={product.id} className="p-4 px-6 text-sm text-slate-600">
                    {product.specs[key] || <span className="text-slate-300">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WishlistPage() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const navigate = useNavigate();

  if (wishlist.length === 0) {
    return (
      <div className="p-20 text-center">
        <Heart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-navy mb-2">Your wishlist is empty</h2>
        <p className="text-slate-500 mb-6">Save products you're interested in to view them later.</p>
        <Button className="bg-navy text-white hover:bg-navy/90 font-bold px-8" onClick={() => navigate('/categories')}>
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-electric-blue">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-navy font-semibold">My Wishlist</span>
      </div>

      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-navy tracking-tight">My Wishlist</h1>
          <p className="text-slate-500">{wishlist.length} items saved</p>
        </div>
        <Button variant="outline" size="sm" onClick={clearWishlist} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100">
          Clear Wishlist
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {wishlist.map(product => (
          <div key={product.id} className="relative group">
            <button 
              onClick={() => removeFromWishlist(product.id)}
              className="absolute top-2 right-2 p-1.5 bg-white/90 text-slate-400 hover:text-red-500 rounded-full shadow-sm z-30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ManufacturersPage() {
  const navigate = useNavigate();

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-electric-blue">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-navy font-semibold">All Manufacturers</span>
      </div>

      <h1 className="text-3xl font-extrabold text-navy mb-8 tracking-tight">Shop by Manufacturer</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {manufacturers.map((brand) => (
          <Card 
            key={brand} 
            className="group cursor-pointer hover:shadow-md transition-all border-slate-200 hover:border-electric-blue/30 focus-visible:ring-2 focus-visible:ring-electric-blue outline-none"
            onClick={() => navigate(`/manufacturer/${slugify(brand)}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(`/manufacturer/${slugify(brand)}`);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`View products from ${brand}`}
          >
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center text-navy font-bold text-xs group-hover:bg-electric-blue/5 transition-colors">
                {brand.split(' ')[0]}
              </div>
              <h4 className="text-sm font-bold text-navy">{brand}</h4>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function LocationsPage() {
  const locations = [
    { name: 'Downtown LA (Main)', address: '123 Industrial Way, Los Angeles, CA 90001', phone: '(213) 555-0123', hours: '6:00 AM - 5:00 PM' },
    { name: 'Santa Monica', address: '456 Coastal Blvd, Santa Monica, CA 90401', phone: '(310) 555-0199', hours: '7:00 AM - 4:00 PM' },
    { name: 'Pasadena', address: '789 Valley Rd, Pasadena, CA 91101', phone: '(626) 555-0144', hours: '6:30 AM - 4:30 PM' },
    { name: 'Long Beach', address: '321 Port Ave, Long Beach, CA 90802', phone: '(562) 555-0188', hours: '6:00 AM - 5:00 PM' },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-electric-blue">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-navy font-semibold">Our Locations</span>
      </div>

      <h1 className="text-3xl font-extrabold text-navy mb-8 tracking-tight">Visit Our LA Warehouses</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {locations.map((loc, i) => (
          <Card key={i} className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-safety-orange" />
                {loc.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-bold text-navy">Address</p>
                <p className="text-sm text-slate-500">{loc.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-navy">Phone</p>
                  <p className="text-sm text-slate-500">{loc.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-navy">Will Call Hours</p>
                  <p className="text-sm text-slate-500">{loc.hours}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full text-electric-blue border-electric-blue/20 hover:bg-electric-blue/5">
                Get Directions
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

function OrderStatusPage() {
  const [orderId, setOrderId] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setTimeout(() => {
      setSearching(false);
      toast.info("Order Found", {
        description: `Order ${orderId} is currently out for delivery.`
      });
    }, 1500);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-electric-blue">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-navy font-semibold">Order Status</span>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-navy mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-black text-navy">Track Your Order</CardTitle>
          <CardDescription>Enter your order number or tracking ID to see the latest status.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderId">Order Number</Label>
              <Input 
                id="orderId" 
                placeholder="e.g. ORD-12345" 
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-navy text-white h-12 font-bold" disabled={searching}>
              {searching ? "Searching..." : "Track Order"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="bg-slate-50/50 flex flex-col gap-2 p-6">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Truck className="w-4 h-4 text-safety-orange" />
            <span>Next-day delivery for all stock items.</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Info className="w-4 h-4 text-electric-blue" />
            <span>Need help? Call our support line at (213) 555-0123.</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

function B2BPricingPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-electric-blue">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-navy font-semibold">B2B Wholesale Pricing</span>
      </div>

      <div className="space-y-12">
        <section className="text-center space-y-4">
          <h1 className="text-4xl font-black text-navy tracking-tight">Contractor Wholesale Pricing</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Get exclusive B2B rates and Net 30 terms for your electrical contracting business.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="w-12 h-12 bg-electric-blue/10 rounded-xl flex items-center justify-center text-electric-blue mb-4">
                <BadgePercent className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl">Tiered Discounts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">Save up to 25% off retail prices on bulk orders and frequent purchases.</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader>
              <div className="w-12 h-12 bg-safety-orange/10 rounded-xl flex items-center justify-center text-safety-orange mb-4">
                <CreditCard className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl">Net 30 Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">Manage your cash flow with flexible credit lines and monthly billing options.</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-4">
                <Truck className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl">Job Site Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">Free next-day delivery to any job site in the Greater Los Angeles area.</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-navy text-white overflow-hidden border-none">
          <CardContent className="p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">Ready to get started?</h2>
              <p className="text-slate-300">Apply for a contractor account today and unlock wholesale pricing instantly.</p>
            </div>
            <Link to="/credit-application">
              <Button className="bg-safety-orange hover:bg-safety-orange/90 text-white font-bold h-14 px-10 text-lg">
                Apply for Net Terms
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TechnicalSupportPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-electric-blue">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-navy font-semibold">Technical Support</span>
      </div>

      <div className="space-y-12">
        <section className="space-y-4">
          <h1 className="text-4xl font-black text-navy tracking-tight">Live Engineering Experts</h1>
          <p className="text-lg text-slate-600">
            Our team of licensed electrical engineers and product specialists are here to help you with complex project requirements.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-electric-blue rounded-full flex items-center justify-center text-white shrink-0">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-navy mb-1">Switchgear Configuration</h3>
                <p className="text-sm text-slate-500">Custom panelboard and switchboard layouts designed to your specifications.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-electric-blue rounded-full flex items-center justify-center text-white shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-navy mb-1">Load Calculations</h3>
                <p className="text-sm text-slate-500">Professional assistance with residential and commercial electrical load schedules.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-electric-blue rounded-full flex items-center justify-center text-white shrink-0">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-navy mb-1">Lighting Layouts</h3>
                <p className="text-sm text-slate-500">Photometric studies and LED conversion plans for energy-efficient upgrades.</p>
              </div>
            </div>
          </div>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Contact an Expert</CardTitle>
              <CardDescription>Available Mon-Fri, 7 AM - 4 PM PT</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg flex items-center gap-4">
                <Phone className="w-5 h-5 text-safety-orange" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Call Support</p>
                  <p className="text-sm font-bold text-navy">(213) 555-0123</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg flex items-center gap-4">
                <Mail className="w-5 h-5 text-safety-orange" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Email Engineering</p>
                  <p className="text-sm font-bold text-navy">engineering@americanelectrics.com</p>
                </div>
              </div>
              <Button className="w-full bg-navy text-white font-bold h-12">
                Schedule a Consultation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ReturnsPolicyPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-electric-blue">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-navy font-semibold">Returns & Exchanges</span>
      </div>

      <h1 className="text-3xl font-black text-navy mb-8">Returns & Exchanges Policy</h1>
      
      <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-navy">Standard Returns</h2>
          <p>We accept returns on all stock items within 30 days of purchase. Items must be in their original, unopened packaging and in resalable condition.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-navy">Restocking Fees</h2>
          <p>A 15% restocking fee applies to all returns unless the item is defective or the return is due to our error.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-navy">Non-Returnable Items</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Custom-cut wire and cable</li>
            <li>Special order items (non-stock)</li>
            <li>Installed or energized electrical components</li>
            <li>Clearance or "Final Sale" items</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-navy">How to Start a Return</h2>
          <p>Log in to your account and visit your Order History to request an RMA (Return Merchandise Authorization). You can also bring items to any of our LA locations for immediate processing.</p>
        </section>
      </div>
    </div>
  );
}

function ShippingPolicyPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-electric-blue">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-navy font-semibold">Shipping Policy</span>
      </div>

      <h1 className="text-3xl font-black text-navy mb-8">Shipping & Delivery</h1>
      
      <div className="prose prose-slate max-w-none space-y-8 text-slate-600">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Local Job Site Delivery</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-bold text-green-600 mb-2">FREE for orders over $500</p>
              <p>Available within 50 miles of our LA warehouses. Orders placed by 4 PM PT are eligible for next-day delivery.</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Will Call Pickup</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-bold text-navy mb-2">Ready in 1 Hour</p>
              <p>Pick up your order at any of our 4 locations. We'll text you when your order is staged and ready.</p>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-navy">National Shipping</h2>
          <p>For orders outside of Southern California, we ship via UPS, FedEx, and LTL freight carriers. Shipping costs are calculated at checkout based on weight and destination.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-navy">Freight Shipments</h2>
          <p>Large items such as conduit bundles, switchgear, and bulk wire reels will ship via LTL freight. Please ensure your job site has a loading dock or forklift available, or request a liftgate service during checkout.</p>
        </section>
      </div>
    </div>
  );
}

function CreditApplicationPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Application Submitted", {
      description: "Our credit department will review your application within 2-3 business days."
    });
  };

  if (submitted) {
    return (
      <div className="p-20 text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black text-navy mb-4">Application Received</h1>
        <p className="text-slate-500 mb-8">Thank you for applying for a contractor credit line with American Electrics. We are currently reviewing your business information.</p>
        <Button className="bg-navy text-white font-bold" onClick={() => window.location.href = '/'}>Return to Home</Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-electric-blue">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-navy font-semibold">B2B Credit Application</span>
      </div>

      <h1 className="text-3xl font-black text-navy mb-2">B2B Credit Application</h1>
      <p className="text-slate-500 mb-8">Apply for Net 30 terms and a dedicated credit line for your business.</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Legal Business Name</Label>
                <Input placeholder="ACME Electric LLC" required />
              </div>
              <div className="space-y-2">
                <Label>Tax ID / EIN</Label>
                <Input placeholder="12-3456789" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contractor License Number</Label>
                <Input placeholder="C-10 #123456" required />
              </div>
              <div className="space-y-2">
                <Label>Requested Credit Limit ($)</Label>
                <Input type="number" placeholder="e.g. 25000" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Business Address</Label>
              <Input placeholder="Street Address" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input placeholder="Los Angeles" required />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input placeholder="CA" required />
              </div>
              <div className="space-y-2">
                <Label>ZIP Code</Label>
                <Input placeholder="90001" required />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Trade References</CardTitle>
            <CardDescription>Please provide at least two current suppliers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="text-sm font-bold text-navy">Reference #1</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Supplier Name" required />
                <Input placeholder="Contact Phone" required />
              </div>
            </div>
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="text-sm font-bold text-navy">Reference #2</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Supplier Name" required />
                <Input placeholder="Contact Phone" required />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Financial Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Accounts Payable Contact</Label>
                <Input placeholder="Name" required />
              </div>
              <div className="space-y-2">
                <Label>AP Email Address</Label>
                <Input type="email" placeholder="billing@company.com" required />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full bg-safety-orange text-white h-14 font-bold text-lg">
          Submit Credit Application
        </Button>
      </form>
    </div>
  );
}

function ContactPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-electric-blue">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-navy font-semibold">Contact Us</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-12">
        <div className="space-y-8">
          <section>
            <h1 className="text-4xl font-black text-navy tracking-tight mb-4">How can we help?</h1>
            <p className="text-slate-500">Send us a message and our team will get back to you within 2 business hours.</p>
          </section>

          <form className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input type="email" placeholder="john@example.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input placeholder="How can we help?" />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <textarea 
                className="w-full min-h-[150px] p-3 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-electric-blue/20"
                placeholder="Tell us more about your project or inquiry..."
              />
            </div>
            <Button className="bg-navy text-white font-bold h-12 px-8">Send Message</Button>
          </form>
        </div>

        <aside className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Direct Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <Phone className="w-5 h-5 text-safety-orange shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Phone</p>
                  <p className="text-sm font-bold text-navy">(213) 555-0123</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Mail className="w-5 h-5 text-safety-orange shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Email</p>
                  <p className="text-sm font-bold text-navy">sales@americanelectrics.com</p>
                </div>
              </div>
              <div className="flex gap-4">
                <MapPin className="w-5 h-5 text-safety-orange shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Headquarters</p>
                  <p className="text-sm font-bold text-navy">123 Industrial Way<br />Los Angeles, CA 90001</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-navy mb-2">Will Call Hours</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Mon - Fri</span>
                <span className="font-bold text-navy">6:00 AM - 5:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Saturday</span>
                <span className="font-bold text-navy">7:00 AM - 12:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sunday</span>
                <span className="text-slate-400">Closed</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ManufacturerPage() {
  const { name } = useParams();
  const actualName = unslugifyManufacturer(name || '');
  const filteredProducts = products.filter(p => p.manufacturer === actualName);

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-electric-blue">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/manufacturers" className="hover:text-electric-blue">Manufacturers</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-navy font-semibold">{actualName}</span>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">{actualName}</h1>
          <p className="text-slate-500 text-sm">{filteredProducts.length} items found</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </Button>
          <Button variant="outline" size="sm">Sort: Featured</Button>
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
          <Package className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-navy">No products found for this manufacturer</h3>
          <p className="text-slate-500">We're adding new inventory daily. Check back soon!</p>
          <Button variant="link" className="text-electric-blue mt-2" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      )}
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { cartCount } = useCart();
  const { comparisonList, removeFromComparison, clearComparison } = useComparison();
  const { wishlist } = useWishlist();
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setShowBackToTop(scrollTop > 400);
  };

  const scrollToTop = () => {
    const viewport = document.querySelector('[data-slot="scroll-area-viewport"]');
    if (viewport) {
      viewport.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLinkClick = (name: string) => {
    toast.info(`${name} page coming soon!`, {
      description: "We're currently building out the full catalog experience.",
    });
  };

  const filteredCategories = searchQuery.length > 1 
    ? categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3)
    : [];

  const filteredProducts = searchQuery.length > 1
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const hasSuggestions = filteredCategories.length > 0 || filteredProducts.length > 0;

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen bg-slate-100 font-sans">
        <Toaster position="top-center" richColors />
        {/* Header */}
        <header className="bg-navy h-[72px] px-4 lg:px-8 flex items-center justify-between text-white sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-navy border-white/10 text-white p-0 w-[320px] flex flex-col">
                <SheetHeader className="p-6 border-b border-white/10 shrink-0">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-white flex flex-col gap-0.5 tracking-tighter">
                      <div className="flex items-center gap-2.5 text-xl font-extrabold">
                        <div className="w-7 h-7 bg-safety-orange logo-bolt" />
                        AMERICAN ELECTRICS
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 pl-9.5">a project of Nazy Rafael</span>
                    </SheetTitle>
                  </div>
                  <div className="mt-2">
                    <Badge className="bg-electric-blue/20 text-electric-blue border-electric-blue/30 text-[10px] font-bold uppercase tracking-wider">
                      Contractor Portal
                    </Badge>
                  </div>
                </SheetHeader>
                
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-8">
                    {/* Primary Navigation */}
                    <div className="space-y-1">
                      <h3 className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main Menu</h3>
                      <SheetClose asChild>
                        <button onClick={() => { navigate('/') }} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-lg transition-colors text-left">
                          <Zap className="w-5 h-5 text-electric-blue" />
                          <span className="font-bold">Home</span>
                        </button>
                      </SheetClose>
                      <SheetClose asChild>
                        <button onClick={() => { navigate('/credit-application') }} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-lg transition-colors text-left">
                          <CreditCard className="w-5 h-5 text-safety-orange" />
                          <span className="font-bold">Apply for Credit</span>
                        </button>
                      </SheetClose>
                      <SheetClose asChild>
                        <button onClick={() => { navigate('/locations') }} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-lg transition-colors text-left">
                          <MapPin className="w-5 h-5 text-slate-400" />
                          <span className="font-bold">Our Locations</span>
                        </button>
                      </SheetClose>
                      <SheetClose asChild>
                        <button onClick={() => { navigate('/order-status') }} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-lg transition-colors text-left">
                          <Package className="w-5 h-5 text-slate-400" />
                          <span className="font-bold">Order Status</span>
                        </button>
                      </SheetClose>
                      <SheetClose asChild>
                        <button onClick={() => { navigate('/account') }} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-lg transition-colors text-left">
                          <User className="w-5 h-5 text-slate-400" />
                          <span className="font-bold">My Account</span>
                        </button>
                      </SheetClose>
                      <SheetClose asChild>
                        <button onClick={() => { navigate('/wishlist') }} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-lg transition-colors text-left">
                          <Heart className="w-5 h-5 text-red-400" />
                          <span className="font-bold">My Wishlist</span>
                        </button>
                      </SheetClose>
                    </div>

                    {/* Categories Accordion */}
                    <div className="space-y-1">
                      <Accordion type="single" collapsible className="w-full border-none">
                        <AccordionItem value="categories" className="border-none">
                          <AccordionTrigger className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:no-underline hover:text-white transition-colors">
                            Shop Categories
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-0 space-y-1">
                            {categories.map(cat => (
                              <SheetClose key={cat.id} asChild>
                                <button
                                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors text-left"
                                  onClick={() => {
                                    navigate(`/category/${cat.id}`);
                                  }}
                                >
                                  <div className="text-white/60 scale-90">{cat.icon}</div>
                                  <span className="text-sm font-medium">{cat.name}</span>
                                </button>
                              </SheetClose>
                            ))}
                            <SheetClose asChild>
                              <button
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors text-left text-electric-blue font-bold"
                                onClick={() => navigate('/categories')}
                              >
                                <div className="w-5 flex justify-center"><ChevronRight className="w-4 h-4" /></div>
                                <span className="text-sm">View All Categories</span>
                              </button>
                            </SheetClose>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>

                    {/* Support & Contact */}
                    <div className="space-y-1">
                      <h3 className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support</h3>
                      <button className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-lg transition-colors text-left">
                        <Phone className="w-5 h-5 text-slate-400" />
                        <span className="text-sm font-medium">(800) 555-ELEC</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-lg transition-colors text-left">
                        <Mail className="w-5 h-5 text-slate-400" />
                        <span className="text-sm font-medium">support@americanelectrics.com</span>
                      </button>
                    </div>
                  </div>
                </ScrollArea>

                <div className="p-6 border-t border-white/10 bg-black/20 shrink-0">
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    © 2024 American Electrics.<br />
                    All rights reserved. Professional Grade Supplies.
                  </p>
                </div>
              </SheetContent>
            </Sheet>

            <Link to="/" className="flex flex-col gap-0.5 tracking-tighter shrink-0">
              <div className="flex items-center gap-2.5 text-xl font-extrabold">
                <div className="w-7 h-7 bg-safety-orange logo-bolt" />
                <span className="hidden sm:inline">AMERICAN ELECTRICS</span>
                <span className="sm:hidden">AMERICAN ELECTRICS</span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 pl-9.5 hidden sm:block">a project of Nazy Rafael</span>
            </Link>
          </div>

          <div className="flex-1 max-w-[500px] mx-4 lg:mx-10 relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 group-focus-within:text-safety-orange transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <Input 
              className="w-full bg-slate-800 border-white/10 pl-10 h-10 text-sm text-white placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-safety-orange focus-visible:border-safety-orange focus-visible:bg-slate-900 transition-all relative z-10 shadow-none focus-visible:shadow-[0_0_20px_rgba(249,115,22,0.15)]" 
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery) {
                  navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                  setShowSuggestions(false);
                }
              }}
            />

          {/* Search Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && hasSuggestions && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50"
              >
                <ScrollArea className="max-h-[400px]">
                  {filteredCategories.length > 0 && (
                    <div className="p-2">
                      <h3 className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categories</h3>
                      {filteredCategories.map(cat => (
                        <button
                          key={cat.id}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-md transition-colors text-left"
                          onClick={() => {
                            navigate(`/category/${cat.id}`);
                            setSearchQuery('');
                            setShowSuggestions(false);
                          }}
                        >
                          <div className="text-navy opacity-60">{cat.icon}</div>
                          <span className="text-sm font-medium text-navy">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {filteredCategories.length > 0 && filteredProducts.length > 0 && <Separator />}

                  {filteredProducts.length > 0 && (
                    <div className="p-2">
                      <h3 className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Products</h3>
                      {filteredProducts.map(prod => (
                        <button
                          key={prod.id}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-md transition-colors text-left"
                          onClick={() => {
                            navigate(`/product/${prod.id}`);
                            setSearchQuery('');
                            setShowSuggestions(false);
                          }}
                        >
                          <img src={prod.image} alt="" className="w-8 h-8 rounded object-cover" referrerPolicy="no-referrer" />
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-bold text-navy truncate">{prod.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">PN: {prod.partNumber}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="p-2 bg-slate-50 border-t border-slate-100">
                    <button 
                      className="w-full text-center py-1.5 text-xs font-bold text-electric-blue hover:underline"
                      onClick={() => {
                        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                        setShowSuggestions(false);
                      }}
                    >
                      View all results for "{searchQuery}"
                    </button>
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="hidden lg:flex items-center gap-6 text-[13px] font-medium">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => navigate('/credit-application')} className="hover:text-safety-orange transition-colors flex items-center gap-1.5 text-safety-orange font-bold">
                <CreditCard className="w-4 h-4" /> Apply for Credit
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-bold">Open Net 30 Credit Application</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => navigate('/locations')} className="hover:text-safety-orange transition-colors flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> Locations
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-bold">Find American Electrics Branches</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => navigate('/order-status')} className="hover:text-safety-orange transition-colors flex items-center gap-1.5">
                <Package className="w-4 h-4" /> Order Status
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-bold">Track Your Shipments</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => navigate('/account')} className="hover:text-safety-orange transition-colors flex items-center gap-1.5">
                <User className="w-4 h-4" /> Account
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-bold">Manage Your B2B Profile</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => navigate('/wishlist')} className="hover:text-safety-orange transition-colors flex items-center gap-1.5 relative">
                <Heart className={`w-4 h-4 ${wishlist.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                {wishlist.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center p-0 border-none">
                    {wishlist.length}
                  </Badge>
                )}
                Wishlist
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-bold">View Your Saved Items</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => navigate('/cart')} className="hover:text-safety-orange transition-colors flex items-center gap-1.5 relative">
                <ShoppingCart className="w-4 h-4" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-safety-orange text-white text-[10px] w-4 h-4 flex items-center justify-center p-0 border-none">
                    {cartCount}
                  </Badge>
                )}
                Cart
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-bold">View Your Current Order</p>
            </TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-3">
            <BulkOrderModal />
            <QuoteModal />
          </div>
        </div>

        {/* Mobile Cart Icon */}
        <div className="lg:hidden flex items-center gap-4">
          <button onClick={() => navigate('/cart')} className="relative text-white">
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-safety-orange text-white text-[10px] w-4 h-4 flex items-center justify-center p-0 border-none">
                {cartCount}
              </Badge>
            )}
          </button>
        </div>
      </header>

      {/* Sub-nav */}
      <nav className="bg-white border-b border-slate-200 h-12 px-8 flex items-center gap-6 text-[13px] font-semibold text-slate-800 overflow-x-auto no-scrollbar sticky top-[72px] z-40 shadow-sm">
        <Link to="/categories" className="cursor-pointer hover:text-safety-orange whitespace-nowrap">Shop All</Link>
        <span onClick={() => handleLinkClick('New Arrivals')} className="text-safety-orange cursor-pointer whitespace-nowrap">New Arrivals</span>
        <Link to="/manufacturers" className="cursor-pointer hover:text-safety-orange whitespace-nowrap">Manufacturers</Link>
        <Link to="/category/panelboards" className="cursor-pointer hover:text-safety-orange whitespace-nowrap">Switchgear</Link>
        <Link to="/category/breakers" className="cursor-pointer hover:text-safety-orange whitespace-nowrap">Circuit Breakers</Link>
        <Link to="/category/conduit" className="cursor-pointer hover:text-safety-orange whitespace-nowrap">Conduit</Link>
        <Link to="/category/wire" className="cursor-pointer hover:text-safety-orange whitespace-nowrap">Wire & Cable</Link>
        <Link to="/category/lighting" className="cursor-pointer hover:text-safety-orange whitespace-nowrap">Lighting</Link>
      </nav>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[240px_1fr] overflow-hidden relative">
        {/* Comparison Floating Bar */}
        <AnimatePresence>
          {comparisonList.length > 0 && (
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 flex items-center gap-6 min-w-[400px]"
            >
              <div className="flex items-center gap-3 border-r border-slate-100 pr-6">
                <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center text-white">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-navy">Compare Items</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{comparisonList.length} Selected</p>
                </div>
              </div>
              
              <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar max-w-[400px]">
                {comparisonList.map(product => (
                  <div key={product.id} className="relative group shrink-0">
                    <img src={product.image} className="w-12 h-12 rounded-lg object-cover border border-slate-100" referrerPolicy="no-referrer" />
                    <button 
                      onClick={() => removeFromComparison(product.id)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pl-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={clearComparison} className="text-xs font-bold text-slate-500">
                      Clear
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs font-bold">Empty Comparison List</p>
                  </TooltipContent>
                </Tooltip>
                <Button 
                  size="sm" 
                  className="bg-navy text-white hover:bg-navy/90 font-bold px-6"
                  onClick={() => navigate('/compare')}
                >
                  Compare Now
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className="hidden lg:block bg-white border-r border-slate-200 p-6 overflow-y-auto">
          <h3 className="text-[12px] uppercase tracking-widest text-slate-800/60 font-bold mb-4">
            Top Manufacturers
          </h3>
          <div className="flex flex-col gap-1">
            {manufacturers.map((brand) => (
              <button 
                key={brand} 
                onClick={() => navigate(`/manufacturer/${slugify(brand)}`)}
                className="py-2 text-left text-sm text-slate-800 hover:text-electric-blue border-b border-slate-50 transition-colors"
              >
                {brand}
              </button>
            ))}
            <button 
              onClick={() => navigate('/manufacturers')}
              className="mt-3 text-left text-sm font-semibold text-electric-blue hover:underline"
            >
              View All 150+ Brands →
            </button>
          </div>
        </aside>

        {/* Center Content */}
        <ScrollArea className="h-full" onScroll={handleScroll}>
          {children}
        </ScrollArea>

        {/* Back to Top Button */}
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 z-[70] w-12 h-12 bg-navy text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-safety-orange transition-colors focus-visible:ring-2 focus-visible:ring-safety-orange outline-none"
              aria-label="Back to top"
            >
              <ChevronUp className="w-6 h-6" />
            </motion.button>
          )}
        </AnimatePresence>
      </main>

      {/* Trust Bar */}
      <div className="bg-white border-t border-slate-200 h-20 px-8 grid grid-cols-2 md:grid-cols-4 items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/locations')}>
              <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center text-navy group-hover:bg-safety-orange group-hover:text-white transition-colors">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-[12px] font-bold text-navy">Local Pickup</h5>
                <p className="text-[11px] text-slate-500">Available in 1 Hour</p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs font-bold">Visit our LA branches for immediate pickup</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/order-status')}>
              <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center text-navy group-hover:bg-safety-orange group-hover:text-white transition-colors">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-[12px] font-bold text-navy">Same-Day Shipping</h5>
                <p className="text-[11px] text-slate-500">Orders before 4PM PT</p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs font-bold">Fast fulfillment for all stock items</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/b2b-pricing')}>
              <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center text-navy group-hover:bg-safety-orange group-hover:text-white transition-colors">
                <BadgePercent className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-[12px] font-bold text-navy">B2B Wholesale Pricing</h5>
                <p className="text-[11px] text-slate-500">Contractor Net Terms</p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs font-bold">Unlock exclusive contractor discounts</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/technical-support')}>
              <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center text-navy group-hover:bg-safety-orange group-hover:text-white transition-colors">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-[12px] font-bold text-navy">Technical Support</h5>
                <p className="text-[11px] text-slate-500">Live Engineering Experts</p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs font-bold">Get help with complex electrical specs</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Main Footer */}
      <footer className="bg-navy text-white pt-16 pb-8 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link to="/" className="flex flex-col gap-0.5 tracking-tighter shrink-0">
              <div className="flex items-center gap-2.5 text-xl font-extrabold">
                <div className="w-7 h-7 bg-safety-orange logo-bolt" />
                <span>AMERICAN ELECTRICS</span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 pl-9.5">a project of Nazy Rafael</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              Southern California's premier B2B electrical distributor. Providing high-quality components to contractors.
            </p>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-safety-orange cursor-pointer transition-colors">
                <Info className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-safety-orange cursor-pointer transition-colors">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-slate-200 uppercase text-xs tracking-widest">Supply Categories</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              {categories.slice(0, 4).map(cat => (
                <li key={cat.id}>
                  <Link to={`/category/${cat.id}`} className="hover:text-white transition-colors flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-safety-orange" />
                    Buy {cat.name} Online
                  </Link>
                </li>
              ))}
              <li><Link to="/categories" className="text-electric-blue font-bold hover:underline">View All Wholesale Supplies</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-slate-200 uppercase text-xs tracking-widest">Contractor Resources</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><Link to="/credit-application" className="hover:text-white transition-colors">Apply for Wholesale Credit Line</Link></li>
              <li><Link to="/technical-support" className="hover:text-white transition-colors">Technical Engineering Support</Link></li>
              <li><Link to="/manufacturers" className="hover:text-white transition-colors">Shop by Brand / Manufacturer</Link></li>
              <li><Link to="/locations" className="hover:text-white transition-colors">Local Southern California Branches</Link></li>
              <li><Link to="/shipping-policy" className="hover:text-white transition-colors">B2B Shipping & Local Delivery</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-slate-200 uppercase text-xs tracking-widest">Newsletter</h4>
            <p className="text-sm text-slate-400 mb-4">Get wholesale deals and inventory updates.</p>
            <div className="flex gap-2">
              <Input className="bg-slate-800 border-slate-700 text-white" placeholder="Email Address" />
              <Button className="bg-safety-orange text-white hover:bg-safety-orange/90 font-bold">Join</Button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-slate-500 font-bold uppercase tracking-widest">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p>© 2024 AMERICAN ELECTRICS. ALL RIGHTS RESERVED.</p>
            <p className="text-[9px] font-medium lowercase">a project of Nazy Rafael</p>
          </div>
          <div className="flex gap-6">
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer">Terms of Service</span>
            <span className="hover:text-white cursor-pointer">Sitemap</span>
          </div>
        </div>
      </footer>
    </div>
    </TooltipProvider>
  );
}

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [comparisonList, setComparisonList] = useState<Product[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);

  const addToCart = (product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const addToComparison = (product: Product) => {
    if (comparisonList.length >= 4) {
      toast.error("Comparison limit reached", {
        description: "You can compare up to 4 products at a time."
      });
      return;
    }
    setComparisonList(prev => [...prev, product]);
    toast.success(`${product.name} added to comparison`, {
      icon: <ArrowLeftRight className="w-4 h-4" />
    });
  };

  const removeFromComparison = (productId: string) => {
    setComparisonList(prev => prev.filter(p => p.id !== productId));
  };

  const clearComparison = () => setComparisonList([]);
  const isInComparison = (productId: string) => comparisonList.some(p => p.id === productId);

  const addToWishlist = (product: Product) => {
    setWishlist(prev => [...prev, product]);
    toast.success(`${product.name} added to wishlist`, {
      icon: <Heart className="fill-red-500 text-red-500 w-4 h-4" />
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist(prev => prev.filter(p => p.id !== productId));
    toast.info("Removed from wishlist");
  };

  const isInWishlist = (productId: string) => wishlist.some(p => p.id === productId);
  const clearWishlist = () => setWishlist([]);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, cartCount, cartTotal }}>
      <ComparisonContext.Provider value={{ comparisonList, addToComparison, removeFromComparison, clearComparison, isInComparison }}>
        <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, clearWishlist }}>
          <Router>
            <ScrollToTop />
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/category/:id" element={<CategoryPage />} />
                <Route path="/search" element={<SearchResultsPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/compare" element={<ComparisonPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/manufacturers" element={<ManufacturersPage />} />
                <Route path="/manufacturer/:name" element={<ManufacturerPage />} />
                <Route path="/locations" element={<LocationsPage />} />
                <Route path="/order-status" element={<OrderStatusPage />} />
                <Route path="/b2b-pricing" element={<B2BPricingPage />} />
                <Route path="/technical-support" element={<TechnicalSupportPage />} />
                <Route path="/returns" element={<ReturnsPolicyPage />} />
                <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
                <Route path="/credit-application" element={<CreditApplicationPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="*" element={<HomePage />} />
              </Routes>
            </Layout>
          </Router>
        </WishlistContext.Provider>
      </ComparisonContext.Provider>
    </CartContext.Provider>
  );
}


