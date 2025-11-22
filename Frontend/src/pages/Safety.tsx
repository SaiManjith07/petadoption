import { ArrowLeft, Dog, Cat, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function Safety() {
  const navigate = useNavigate();

  const animalTips = [
    {
      icon: Dog,
      title: 'Dog Safety',
      tips: [
        'Microchip your dog and keep registration updated',
        'Use a secure collar with ID tags including your phone number',
        'Supervise your dog near roads and in unfamiliar areas',
        'Maintain up-to-date vaccinations (rabies, distemper, parvovirus)',
        'Use a leash in public spaces for their safety',
        'Ensure your yard is securely fenced with no escape routes',
        'Never leave dogs in hot cars or extreme weather conditions',
        'Socialize your dog early and train basic commands',
      ],
    },
    {
      icon: Cat,
      title: 'Cat Safety',
      tips: [
        'Microchip your cat - they often slip out of collars',
        'Provide indoor enrichment (scratching posts, toys, perches)',
        'Keep litter boxes clean and accessible',
        'Carefully manage outdoor access - consider a catio',
        'Use breakaway collars to prevent choking hazards',
        'Keep toxic plants, chemicals, and small objects out of reach',
        'Regular vet checkups and vaccinations',
        'Spay or neuter to reduce roaming behavior',
      ],
    },
  ];

  const generalTips = [
    {
      title: 'Cattle (Cows)',
      tips: [
        'Provide adequate shelter from extreme heat and cold',
        'Maintain secure, sturdy fencing appropriate for size',
        'Ensure access to clean water at all times',
        'Regular veterinary checkups and hoof care',
        'Provide proper nutrition based on age and health',
        'Handle calmly to prevent stress and injury',
        'Keep identification tags or ear tags current',
      ],
    },
    {
      title: 'Camels',
      tips: [
        'Provide appropriate diet (hay, grains, supplements)',
        'Ensure access to shade and large outdoor space',
        'Regular hoof trimming and dental care',
        'Handle with experienced caretakers only',
        'Protect from extreme weather despite hardiness',
        'Regular health monitoring by exotic animal vet',
        'Secure enclosures designed for camel strength',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Pet Safety Guidelines</h1>
          <p className="text-muted-foreground">
            Essential tips to keep your pets safe and prevent them from getting lost
          </p>
        </div>

        {/* Alert Box */}
        <Card className="mb-8 border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2 text-gray-900">Prevention is Key</h3>
                <p className="text-sm text-gray-700">
                  Most lost pets can be prevented with proper identification, secure enclosures,
                  and responsible supervision. Follow these guidelines to keep your pets safe.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Primary Animal Tips */}
        <div className="grid gap-8 md:grid-cols-2 mb-8">
          {animalTips.map((animal) => (
            <Card key={animal.title}>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <animal.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{animal.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {animal.tips.map((tip, index) => (
                    <li key={index} className="flex gap-3 text-sm">
                      <span className="text-primary font-bold flex-shrink-0">•</span>
                      <span className="text-muted-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Other Animals */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Other Animals</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {generalTips.map((animal) => (
              <Card key={animal.title}>
                <CardHeader>
                  <CardTitle className="text-xl">{animal.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {animal.tips.map((tip, index) => (
                      <li key={index} className="flex gap-3 text-sm">
                        <span className="text-primary font-bold flex-shrink-0">•</span>
                        <span className="text-muted-foreground">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* General Safety Tips */}
        <Card className="border-green-100 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-green-600" />
              <div>
                <CardTitle className="text-2xl">General Safety for All Pets</CardTitle>
                <CardDescription>Universal guidelines that apply to all animals</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-semibold mb-3 text-gray-900">Identification</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Microchip with updated contact information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Visible ID tags with current phone number</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Recent, clear photos for identification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Document unique markings or features</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-gray-900">Prevention</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Never leave young animals unattended</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Secure all gates, doors, and enclosures</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Use proper restraints during transport</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Be extra careful during loud events (fireworks, storms)</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-gray-900">Health & Wellness</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Regular veterinary checkups</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Up-to-date on all vaccinations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Spay/neuter to reduce roaming</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Proper nutrition and exercise</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-gray-900">Reporting</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Report lost pets immediately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Check local shelters regularly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Use online pet finding services</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Report any suspected abuse or neglect</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Need to report a lost or found pet?
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <a href="/pets/new/found">Report Found Pet</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/pets/new/lost">Report Lost Pet</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
