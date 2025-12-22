import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, CheckCircle, XCircle, RefreshCw, Image as ImageIcon } from 'lucide-react';
import apiClient from '@/api/apiClient';

interface CloudinaryTestResult {
  success: boolean;
  cloudinary_url?: string;
  public_id?: string;
  format?: string;
  width?: number;
  height?: number;
  size_bytes?: number;
  error?: string;
  message?: string;
}

interface CloudinaryConfig {
  success: boolean;
  config?: {
    cloud_name: string;
    api_key: string;
    api_secret_set: boolean;
    configured: boolean;
  };
  error?: string;
}

interface PetsWithCloudinary {
  success: boolean;
  statistics?: {
    total_pets: number;
    pets_with_cloudinary: number;
    pets_without_cloudinary: number;
    total_additional_images: number;
    images_with_cloudinary: number;
    images_without_cloudinary: number;
  };
  pets_with_cloudinary?: Array<{
    id: number;
    name: string;
    cloudinary_url: string;
    cloudinary_public_id: string;
    created_at: string;
  }>;
  images_with_cloudinary?: Array<{
    id: number;
    pet_id: number;
    cloudinary_url: string;
    cloudinary_public_id: string;
    created_at: string;
  }>;
  error?: string;
}

export default function CloudinaryTest() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<CloudinaryTestResult | null>(null);
  const [config, setConfig] = useState<CloudinaryConfig | null>(null);
  const [petsData, setPetsData] = useState<PetsWithCloudinary | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [loadingPets, setLoadingPets] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  const testUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select an image file to upload',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await apiClient.post('/pets/test/cloudinary/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadResult(response.data);
      
      if (response.data.success) {
        toast({
          title: 'Upload Successful!',
          description: 'Image uploaded to Cloudinary successfully',
        });
        // Refresh pets data
        loadPetsData();
      } else {
        toast({
          title: 'Upload Failed',
          description: response.data.error || 'Failed to upload image',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to upload image';
      setUploadResult({
        success: false,
        error: errorMessage,
      });
      toast({
        title: 'Upload Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const checkConfig = async () => {
    setLoadingConfig(true);
    try {
      const response = await apiClient.get('/pets/test/cloudinary/config/');
      setConfig(response.data);
      
      if (response.data.success) {
        toast({
          title: 'Configuration Check',
          description: 'Cloudinary is configured correctly',
        });
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to check configuration';
      setConfig({
        success: false,
        error: errorMessage,
      });
      toast({
        title: 'Configuration Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoadingConfig(false);
    }
  };

  const loadPetsData = async () => {
    setLoadingPets(true);
    try {
      const response = await apiClient.get('/pets/test/cloudinary/pets/');
      setPetsData(response.data);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to load pets data';
      setPetsData({
        success: false,
        error: errorMessage,
      });
      toast({
        title: 'Load Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoadingPets(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cloudinary Integration Test</h1>
        <p className="text-gray-600">Test and verify Cloudinary image uploads before full integration</p>
      </div>

      {/* Configuration Check */}
      <Card>
        <CardHeader>
          <CardTitle>Cloudinary Configuration</CardTitle>
          <CardDescription>Check if Cloudinary is properly configured</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkConfig} disabled={loadingConfig}>
            {loadingConfig ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Check Configuration
              </>
            )}
          </Button>
          
          {config && (
            <div className={`p-4 rounded-lg ${config.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {config.success ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Cloudinary is configured</span>
                  </div>
                  {config.config && (
                    <div className="mt-3 space-y-1 text-sm">
                      <p><strong>Cloud Name:</strong> {config.config.cloud_name}</p>
                      <p><strong>API Key:</strong> {config.config.api_key}</p>
                      <p><strong>API Secret:</strong> {config.config.api_secret_set ? '✓ Set' : '✗ Not set'}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">Configuration Error: {config.error}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Test Image Upload</CardTitle>
          <CardDescription>Upload a test image to Cloudinary</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
            {selectedFile && (
              <p className="text-sm text-gray-600">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <Button 
            onClick={testUpload} 
            disabled={!selectedFile || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload to Cloudinary
              </>
            )}
          </Button>

          {uploadResult && (
            <div className={`p-4 rounded-lg border ${uploadResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              {uploadResult.success ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Upload Successful!</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><strong>Cloudinary URL:</strong></p>
                    <a 
                      href={uploadResult.cloudinary_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {uploadResult.cloudinary_url}
                    </a>
                    <p><strong>Public ID:</strong> {uploadResult.public_id}</p>
                    {uploadResult.format && <p><strong>Format:</strong> {uploadResult.format}</p>}
                    {uploadResult.width && uploadResult.height && (
                      <p><strong>Dimensions:</strong> {uploadResult.width} x {uploadResult.height}px</p>
                    )}
                    {uploadResult.size_bytes && (
                      <p><strong>Size:</strong> {(uploadResult.size_bytes / 1024).toFixed(2)} KB</p>
                    )}
                    {uploadResult.cloudinary_url && (
                      <div className="mt-4">
                        <p className="font-semibold mb-2">Preview:</p>
                        <img 
                          src={uploadResult.cloudinary_url} 
                          alt="Uploaded" 
                          className="max-w-full h-auto rounded-lg border border-gray-200"
                          style={{ maxHeight: '300px' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-5 w-5" />
                  <div>
                    <span className="font-semibold">Upload Failed</span>
                    <p className="text-sm mt-1">{uploadResult.error || uploadResult.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pets with Cloudinary URLs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pets with Cloudinary URLs</CardTitle>
              <CardDescription>View all pets that have Cloudinary URLs stored</CardDescription>
            </div>
            <Button onClick={loadPetsData} disabled={loadingPets} variant="outline" size="sm">
              {loadingPets ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {petsData && petsData.success && petsData.statistics && (
            <div className="space-y-6">
              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600">Total Pets</p>
                  <p className="text-2xl font-bold text-blue-700">{petsData.statistics.total_pets}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600">With Cloudinary</p>
                  <p className="text-2xl font-bold text-green-700">{petsData.statistics.pets_with_cloudinary}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-gray-600">Without Cloudinary</p>
                  <p className="text-2xl font-bold text-orange-700">{petsData.statistics.pets_without_cloudinary}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-600">Total Images</p>
                  <p className="text-2xl font-bold text-purple-700">{petsData.statistics.total_additional_images}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600">Images with Cloudinary</p>
                  <p className="text-2xl font-bold text-green-700">{petsData.statistics.images_with_cloudinary}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-gray-600">Images without Cloudinary</p>
                  <p className="text-2xl font-bold text-orange-700">{petsData.statistics.images_without_cloudinary}</p>
                </div>
              </div>

              {/* Pets List */}
              {petsData.pets_with_cloudinary && petsData.pets_with_cloudinary.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Pets with Cloudinary URLs</h3>
                  <div className="space-y-3">
                    {petsData.pets_with_cloudinary.map((pet) => (
                      <div key={pet.id} className="p-4 border rounded-lg bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold">Pet ID: {pet.id} - {pet.name}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Created: {new Date(pet.created_at).toLocaleString()}
                            </p>
                            <p className="text-sm text-blue-600 mt-2 break-all">
                              <strong>URL:</strong> {pet.cloudinary_url}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Public ID:</strong> {pet.cloudinary_public_id}
                            </p>
                          </div>
                          {pet.cloudinary_url && (
                            <img 
                              src={pet.cloudinary_url} 
                              alt={pet.name}
                              className="w-24 h-24 object-cover rounded-lg border border-gray-200 ml-4"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Images */}
              {petsData.images_with_cloudinary && petsData.images_with_cloudinary.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Additional Images with Cloudinary URLs</h3>
                  <div className="space-y-3">
                    {petsData.images_with_cloudinary.map((img) => (
                      <div key={img.id} className="p-4 border rounded-lg bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold">Image ID: {img.id} (Pet ID: {img.pet_id})</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Created: {new Date(img.created_at).toLocaleString()}
                            </p>
                            <p className="text-sm text-blue-600 mt-2 break-all">
                              <strong>URL:</strong> {img.cloudinary_url}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Public ID:</strong> {img.cloudinary_public_id}
                            </p>
                          </div>
                          {img.cloudinary_url && (
                            <img 
                              src={img.cloudinary_url} 
                              alt={`Image ${img.id}`}
                              className="w-24 h-24 object-cover rounded-lg border border-gray-200 ml-4"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!petsData.pets_with_cloudinary || petsData.pets_with_cloudinary.length === 0) && 
               (!petsData.images_with_cloudinary || petsData.images_with_cloudinary.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No pets or images with Cloudinary URLs found.</p>
                  <p className="text-sm mt-1">Upload a pet with an image to see it here.</p>
                </div>
              )}
            </div>
          )}

          {petsData && !petsData.success && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                <span className="font-semibold">Error: {petsData.error}</span>
              </div>
            </div>
          )}

          {!petsData && (
            <div className="text-center py-8">
              <Button onClick={loadPetsData} disabled={loadingPets}>
                {loadingPets ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Load Pets Data
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

