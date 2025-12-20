import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

/**
 * Pet species selector
 */
export const SpeciesSelector = ({ value, onChange, error }) => {
  const species = ['Dog', 'Cat', 'Cow', 'Buffalo', 'Goat', 'Sheep', 'Camel', 'Horse', 'Bird', 'Rabbit', 'Reptile', 'Other'];

  return (
    <div className="space-y-2">
      <Label htmlFor="species">
        Species <span className="text-red-500">*</span>
      </Label>
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger id="species" className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder="Select species" />
        </SelectTrigger>
        <SelectContent>
          {species.map(s => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
    </div>
  );
};

/**
 * Breed text input
 */
export const BreedInput = ({ value, onChange, error }) => (
  <div className="space-y-2">
    <Label htmlFor="breed">Breed</Label>
    <Input
      id="breed"
      placeholder="e.g., Golden Retriever, Persian Cat"
      value={value}
      onChange={e => onChange(e.target.value)}
      className={error ? 'border-red-500' : ''}
    />
    {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
  </div>
);

/**
 * Sex selector
 */
export const SexSelector = ({ value, onChange, error }) => (
  <div className="space-y-2">
    <Label htmlFor="sex">
      Sex <span className="text-red-500">*</span>
    </Label>
    <Select value={value || ''} onValueChange={onChange}>
      <SelectTrigger id="sex" className={error ? 'border-red-500' : ''}>
        <SelectValue placeholder="Select sex" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Male">Male</SelectItem>
        <SelectItem value="Female">Female</SelectItem>
        <SelectItem value="Unknown">Unknown</SelectItem>
      </SelectContent>
    </Select>
    {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
  </div>
);

/**
 * Age estimator
 */
export const AgeSelector = ({ value, onChange, error }) => (
  <div className="space-y-2">
    <Label htmlFor="age">Estimated Age</Label>
    <Select value={value || ''} onValueChange={onChange}>
      <SelectTrigger id="age" className={error ? 'border-red-500' : ''}>
        <SelectValue placeholder="Select age" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="puppy/kitten">Puppy/Kitten</SelectItem>
        <SelectItem value="young">Young (1-3 years)</SelectItem>
        <SelectItem value="adult">Adult (3-7 years)</SelectItem>
        <SelectItem value="senior">Senior (7+ years)</SelectItem>
        <SelectItem value="unknown">Unknown</SelectItem>
      </SelectContent>
    </Select>
    {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
  </div>
);

/**
 * Size selector
 */
export const SizeSelector = ({ value, onChange, error }) => (
  <div className="space-y-2">
    <Label htmlFor="size">Size</Label>
    <Select value={value || ''} onValueChange={onChange}>
      <SelectTrigger id="size" className={error ? 'border-red-500' : ''}>
        <SelectValue placeholder="Select size" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Small">Small</SelectItem>
        <SelectItem value="Medium">Medium</SelectItem>
        <SelectItem value="Large">Large</SelectItem>
        <SelectItem value="Extra Large">Extra Large</SelectItem>
        <SelectItem value="Unknown">Unknown</SelectItem>
      </SelectContent>
    </Select>
    {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
  </div>
);

/**
 * Color input (primary & secondary)
 */
export const ColorInput = ({ label, value, onChange, error, required = false }) => (
  <div className="space-y-2">
    <Label htmlFor={label}>
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    <Input
      id={label}
      placeholder={label === 'Primary Color' ? 'e.g., brown, white, black' : 'e.g., spots, patches'}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={error ? 'border-red-500' : ''}
    />
    {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
  </div>
);

/**
 * Coat type selector
 */
export const CoatTypeSelector = ({ value, onChange, error }) => (
  <div className="space-y-2">
    <Label htmlFor="coatType">Coat Type</Label>
    <Select value={value || ''} onValueChange={onChange}>
      <SelectTrigger id="coatType" className={error ? 'border-red-500' : ''}>
        <SelectValue placeholder="Select coat type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Short">Short</SelectItem>
        <SelectItem value="Hairy">Hairy</SelectItem>
        <SelectItem value="Curly">Curly</SelectItem>
        <SelectItem value="Feathered">Feathered</SelectItem>
        <SelectItem value="Woolly">Woolly</SelectItem>
        <SelectItem value="Bald">Bald</SelectItem>
        <SelectItem value="Unknown">Unknown</SelectItem>
      </SelectContent>
    </Select>
    {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
  </div>
);

/**
 * Distinguishing marks textarea
 */
export const DistinguishingMarksInput = ({ value, onChange, error }) => (
  <div className="space-y-2">
    <Label htmlFor="marks">
      Distinguishing Marks <span className="text-red-500">*</span>
    </Label>
    <Textarea
      id="marks"
      placeholder="Describe unique features: scars, tattoos, ear notches, missing parts, white patches, etc. Be specific and detailed."
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={4}
      className={error ? 'border-red-500' : ''}
    />
    <p className="text-xs text-gray-500">Minimum 5 characters, maximum 1000</p>
    {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
  </div>
);

/**
 * Microchip ID input
 */
export const MicrochipIdInput = ({ value, onChange, error }) => (
  <div className="space-y-2">
    <Label htmlFor="microchip">Microchip ID</Label>
    <Input
      id="microchip"
      placeholder="e.g., 9824765098A12C"
      value={value}
      onChange={e => onChange(e.target.value.toUpperCase())}
      className={error ? 'border-red-500' : ''}
    />
    <p className="text-xs text-gray-500">Alphanumeric only. If you have this info, it helps us find exact matches.</p>
    {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
  </div>
);

/**
 * Collar tag input
 */
export const CollarTagInput = ({ value, onChange, error }) => (
  <div className="space-y-2">
    <Label htmlFor="collarTag">Collar Tag Info</Label>
    <Input
      id="collarTag"
      placeholder="Phone number or text on tag"
      value={value}
      onChange={e => onChange(e.target.value)}
      className={error ? 'border-red-500' : ''}
    />
    {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
  </div>
);

/**
 * Behavior & medical notes
 */
export const NotesInput = ({ label, value, onChange, error, placeholder }) => (
  <div className="space-y-2">
    <Label htmlFor={label}>{label}</Label>
    <Textarea
      id={label}
      placeholder={placeholder || ''}
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={3}
      className={error ? 'border-red-500' : ''}
    />
    <p className="text-xs text-gray-500">Maximum 500 characters</p>
    {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
  </div>
);

/**
 * Location input
 */
export const LocationInput = ({ value, onChange, error }) => (
  <div className="space-y-2">
    <Label htmlFor="location">
      Location (Address/Landmark) <span className="text-red-500">*</span>
    </Label>
    <Textarea
      id="location"
      placeholder="e.g., Near Central Park, 5th Ave & 72nd St, New York"
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={2}
      className={error ? 'border-red-500' : ''}
    />
    {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
  </div>
);

/**
 * Pincode input
 */
export const PincodeInput = ({ value, onChange, error }) => (
  <div className="space-y-2">
    <Label htmlFor="pincode">Postal Code</Label>
    <Input
      id="pincode"
      placeholder="e.g., 10021"
      value={value}
      onChange={e => onChange(e.target.value)}
      className={error ? 'border-red-500' : ''}
    />
    {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
  </div>
);

/**
 * Date/Time input
 */
export const DateTimeInput = ({ label, value, onChange, error }) => (
  <div className="space-y-2">
    <Label htmlFor="datetime">
      {label} <span className="text-red-500">*</span>
    </Label>
    <Input
      id="datetime"
      type="datetime-local"
      value={value}
      onChange={e => onChange(e.target.value)}
      className={error ? 'border-red-500' : ''}
    />
    {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
  </div>
);

/**
 * Contact preference selector
 */
export const ContactPreferenceSelector = ({ value, onChange, error }) => (
  <div className="space-y-2">
    <Label htmlFor="contact">
      How should we contact you? <span className="text-red-500">*</span>
    </Label>
    <Select value={value || ''} onValueChange={onChange}>
      <SelectTrigger id="contact" className={error ? 'border-red-500' : ''}>
        <SelectValue placeholder="Select contact method" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Phone">Phone Call</SelectItem>
        <SelectItem value="SMS">SMS/Text</SelectItem>
        <SelectItem value="Email">Email</SelectItem>
        <SelectItem value="In-app message">In-app Message</SelectItem>
      </SelectContent>
    </Select>
    {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
  </div>
);

/**
 * Tags input (for additional characteristics)
 */
export const TagsInput = ({ value, onChange, error }) => {
  const suggestions = ['injured', 'limping', 'pregnant', 'nursing', 'friendly with kids', 'shy', 'aggressive', 'vaccinated'];

  return (
    <div className="space-y-2">
      <Label>Additional Tags</Label>
      <div className="space-y-2">
        <Input
          placeholder="Add tags (e.g., injured, limping). Press Enter to add."
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const tag = e.currentTarget.value.trim();
              if (tag && value.length < 10) {
                onChange([...value, tag]);
                e.currentTarget.value = '';
              }
            }
          }}
          className={error ? 'border-red-500' : ''}
        />
        <div className="flex flex-wrap gap-2">
          {value.map((tag, idx) => (
            <div key={idx} className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-sm flex items-center gap-2">
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== idx))}
                className="hover:text-orange-900"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {suggestions.map(sug => (
            <button
              key={sug}
              type="button"
              onClick={() => !value.includes(sug) && value.length < 10 && onChange([...value, sug])}
              className={`text-xs px-2 py-1 rounded border ${value.includes(sug) ? 'bg-gray-100 text-gray-500' : 'border-gray-300 hover:bg-gray-50'}`}
              disabled={value.includes(sug)}
            >
              {sug}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
    </div>
  );
};

/**
 * Photo uploader with drag-and-drop
 */
export const PhotoUploader = ({ files, onFilesChange, error }) => {
  const [dragActive, setDragActive] = React.useState(false);

  const handleDrag = e => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer?.files || []) as File[];
    const newFiles = [...files];
    for (const file of droppedFiles) {
      if (newFiles.length < 8 && file.type.startsWith('image/')) {
        newFiles.push(file);
      }
    }
    onFilesChange(newFiles.slice(0, 8));
  };

  const handleChange = e => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles = [...files, ...selectedFiles].slice(0, 8);
    onFilesChange(newFiles);
  };

  return (
    <div className="space-y-2">
      <Label>
        Photos <span className="text-red-500">*</span>
      </Label>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-gray-400'
        } ${error ? 'border-red-500' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/heic"
          onChange={handleChange}
          className="hidden"
          id="photoInput"
        />
        <label htmlFor="photoInput" className="cursor-pointer">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Drag and drop photos here, or click to select</p>
            <p className="text-xs text-gray-500">JPG, PNG, HEIC • Up to 8MB each • Min 1, Max 8 photos</p>
          </div>
        </label>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {files.map((file, idx) => (
            <div key={idx} className="relative group">
              <img
                src={typeof file === 'string' ? file : URL.createObjectURL(file)}
                alt={`Preview ${idx}`}
                className="w-full h-20 object-cover rounded border border-gray-200"
              />
              <button
                type="button"
                onClick={() => onFilesChange(files.filter((_, i) => i !== idx))}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
    </div>
  );
};

/**
 * Map location picker (simplified with lat/lon inputs)
 */
export const LocationPicker = ({ coords, onChange, error }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Coordinates (Optional)</CardTitle>
        <CardDescription>If you know the exact coordinates, enter them here</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="0.0001"
              min="-90"
              max="90"
              placeholder="40.7128"
              value={coords.latitude || ''}
              onChange={e => onChange({ ...coords, latitude: e.target.value })}
              className={error?.latitude ? 'border-red-500' : ''}
            />
            {error?.latitude && <p className="text-xs text-red-500">{error.latitude}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="0.0001"
              min="-180"
              max="180"
              placeholder="-74.0060"
              value={coords.longitude || ''}
              onChange={e => onChange({ ...coords, longitude: e.target.value })}
              className={error?.longitude ? 'border-red-500' : ''}
            />
            {error?.longitude && <p className="text-xs text-red-500">{error.longitude}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
