import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function Policy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Adoption Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">Our Mission</h2>
              <p className="text-muted-foreground">
                We prioritize the welfare of animals and responsible ownership. Every adoption
                is carefully reviewed to ensure the best possible match between pet and family.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Eligibility Requirements</h2>
              <ul className="space-y-2 text-muted-foreground list-disc pl-6">
                <li>Applicants must be 18 years or older with valid government-issued ID</li>
                <li>Some animals may have specific requirements based on breed, size, or special needs</li>
                <li>Proof of residence and landlord approval (if renting) may be required</li>
                <li>All household members should be aware of and agree to the adoption</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">2. Screening Process</h2>
              <ul className="space-y-2 text-muted-foreground list-disc pl-6">
                <li>Complete adoption application form with detailed information</li>
                <li>Provide personal and veterinary references</li>
                <li>Optional home check may be conducted by our team</li>
                <li>Meet-and-greet session with the pet before finalizing adoption</li>
                <li>Processing time typically takes 3-7 business days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">3. Medical Care Requirements</h2>
              <ul className="space-y-2 text-muted-foreground list-disc pl-6">
                <li>All adopted pets must receive recommended vaccinations</li>
                <li>Spay/neuter is required for pets of appropriate age (may be included in adoption fee)</li>
                <li>Regular veterinary checkups and preventive care are mandatory</li>
                <li>Microchipping is strongly recommended and may be required</li>
                <li>Follow-up health checks may be requested within first 30 days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">4. Adoption Fees</h2>
              <p className="text-muted-foreground mb-3">
                Adoption fees help cover the costs of:
              </p>
              <ul className="space-y-2 text-muted-foreground list-disc pl-6">
                <li>Veterinary care (vaccinations, spay/neuter, treatments)</li>
                <li>Shelter operations and animal care supplies</li>
                <li>Microchipping and registration</li>
                <li>Food and housing during shelter stay</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                Fee waivers or reductions may be available on a case-by-case basis. Please contact us
                to discuss if cost is a concern.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">5. Return Policy</h2>
              <p className="text-muted-foreground mb-3">
                We understand that sometimes adoptions don't work out as planned. If you're experiencing
                difficulties:
              </p>
              <ul className="space-y-2 text-muted-foreground list-disc pl-6">
                <li>Contact us within 30 days to discuss any issues or concerns</li>
                <li>We offer support and guidance for behavioral or adjustment challenges</li>
                <li>If return is necessary, bring the pet back to our facility with adoption paperwork</li>
                <li>We will help find the pet a new suitable home</li>
                <li>Partial fee refunds may be available within the first 14 days</li>
                <li>Do not rehome the pet yourself - always contact us first</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">6. Post-Adoption Support</h2>
              <ul className="space-y-2 text-muted-foreground list-disc pl-6">
                <li>Ongoing support and advice from our team</li>
                <li>Access to training resources and recommendations</li>
                <li>Community events and adoption reunions</li>
                <li>24/7 emergency contact for urgent pet health concerns</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">7. Responsibilities as an Adopter</h2>
              <ul className="space-y-2 text-muted-foreground list-disc pl-6">
                <li>Provide proper food, water, shelter, and veterinary care</li>
                <li>Keep the pet safe and secure (fenced yard, leash, indoor housing as appropriate)</li>
                <li>Provide adequate exercise and mental stimulation</li>
                <li>Never abuse, neglect, or abandon the animal</li>
                <li>Update microchip and ID tag information</li>
                <li>Comply with local pet licensing and ordinances</li>
              </ul>
            </section>

            <section className="border-t pt-6">
              <h2 className="text-2xl font-semibold mb-3">Questions?</h2>
              <p className="text-muted-foreground mb-4">
                If you have questions about our adoption policy or the adoption process, please don't
                hesitate to reach out:
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild>
                  <a href="mailto:contact@petreunite.org">Contact Us</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/pets/adopt">View Adoptable Pets</a>
                </Button>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
