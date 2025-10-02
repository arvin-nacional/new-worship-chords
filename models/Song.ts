import mongoose, { Document, Model, Schema, Types } from "mongoose";

// ============= INTERFACES =============

// Comment subdocument interface
export interface IComment {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  userName: string; // Denormalized for performance
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

// Rating subdocument interface
export interface IRating {
  user: Types.ObjectId;
  value: number; // 1-5 stars
  createdAt: Date;
}

// Chord progression line interface
export interface IChordLine {
  lyrics: string;
  chords?: Array<{
    chord: string;    // e.g., "G", "Am7", "Dsus4"
    position: number; // Character position in lyrics
  }>;
}

// Main Song document interface
export interface ISong extends Document {
  _id: Types.ObjectId;
  title: string;
  artist?: string;
  writer: string;
  originalKey: string;
  currentKey?: string; // For transposed versions
  
  // Structured lyrics with chord positions
  sections: Array<{
    name: string; // "Verse 1", "Chorus", "Bridge", etc.
    lines: IChordLine[];
  }>;
  
  // Alternative: Simple text (for backward compatibility)
  lyricsText?: string;
  
  // Media
  imageUrl?: string;
  videoId?: string;
  spotifyId?: string;
  vocalsUrl?: string; // S3 URL for extracted vocals
  instrumentalUrl?: string; // S3 URL for extracted instrumentals


  
  // Metadata
  tags: string[];
  tempo?: number; // BPM
  timeSignature?: string; // "4/4", "3/4", etc.
  capo?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  
  // User interactions
  createdBy: Types.ObjectId;
  ratings: IRating[];
  favorites: Types.ObjectId[]; // User IDs who favorited
  comments: IComment[];
  viewCount: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual fields
  averageRating?: number;
  ratingsCount?: number;
  favoritesCount?: number;
  
  // Methods
  transposeChords(fromKey: string, toKey: string): ISong;
  addComment(userId: Types.ObjectId, userName: string, text: string): Promise<ISong>;
  addRating(userId: Types.ObjectId, value: number): Promise<ISong>;
  toggleFavorite(userId: Types.ObjectId): Promise<ISong>;
}

// ============= SUBDOCUMENT SCHEMAS =============

const commentSchema = new Schema<IComment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
  },
  { timestamps: true }
);

const ratingSchema = new Schema<IRating>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  value: {
    type: Number,
    required: true,
    min: [1, "Rating must be at least 1"],
    max: [5, "Rating cannot exceed 5"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const chordLineSchema = new Schema<IChordLine>({
  lyrics: {
    type: String,
    required: true,
  },
  chords: [
    {
      chord: {
        type: String,
        required: true,
        trim: true,
      },
      position: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  ],
});

// ============= MAIN SONG SCHEMA =============

const songSchema = new Schema<ISong>(
  {
    title: {
      type: String,
      required: [true, "Song title is required"],
      trim: true,
      minlength: [1, "Title cannot be empty"],
      maxlength: [200, "Title cannot exceed 200 characters"],
      index: 'text', // Text index for search
    },
    artist: {
      type: String,
      trim: true,
      maxlength: [100, "Artist name cannot exceed 100 characters"],
    },
    writer: {
      type: String,
      required: [true, "Writer/composer is required"],
      trim: true,
      maxlength: [200, "Writer name cannot exceed 200 characters"],
    },
    originalKey: {
      type: String,
      required: [true, "Original key is required"],
      trim: true,
      uppercase: true,
      enum: {
        values: ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'],
        message: '{VALUE} is not a valid musical key',
      },
    },
    currentKey: {
      type: String,
      trim: true,
      uppercase: true,
    },
    sections: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        lines: [chordLineSchema],
      },
    ],
    lyricsText: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      match: [
        /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i,
        'Please provide a valid image URL',
      ],
    },
    videoId: {
      type: String,
      trim: true,
      match: [
        /^[a-zA-Z0-9_-]{11}$/,
        'Please provide a valid YouTube video ID',
      ],
    },
    spotifyId: {
      type: String,
      trim: true,
    },
    vocalsUrl: {
      type: String,
      trim: true,
    },
    instrumentalUrl: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function(tags: string[]) {
          return tags.length <= 10;
        },
        message: 'Cannot have more than 10 tags',
      },
    },
    tempo: {
      type: Number,
      min: [40, "Tempo must be at least 40 BPM"],
      max: [240, "Tempo cannot exceed 240 BPM"],
    },
    timeSignature: {
      type: String,
      enum: ['2/4', '3/4', '4/4', '5/4', '6/8', '9/8', '12/8'],
      default: '4/4',
    },
    capo: {
      type: Number,
      min: [0, "Capo cannot be negative"],
      max: [12, "Capo cannot exceed 12"],
      default: 0,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
      index: true,
    },
    ratings: {
      type: [ratingSchema],
      default: [],
    },
    favorites: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
      index: true,
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============= INDEXES =============

// Compound indexes for common queries
songSchema.index({ title: 'text', writer: 'text', tags: 'text' }); // Full-text search
songSchema.index({ createdBy: 1, createdAt: -1 }); // User's songs sorted by date
songSchema.index({ originalKey: 1 }); // Filter by key
songSchema.index({ difficulty: 1 }); // Filter by difficulty
songSchema.index({ 'ratings.value': -1 }); // Sort by rating
songSchema.index({ viewCount: -1 }); // Sort by popularity

// ============= VIRTUAL FIELDS =============

// Average rating
songSchema.virtual('averageRating').get(function() {
  if (this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((acc, rating) => acc + rating.value, 0);
  return Math.round((sum / this.ratings.length) * 10) / 10; // Round to 1 decimal
});

// Ratings count
songSchema.virtual('ratingsCount').get(function() {
  return this.ratings.length;
});

// Favorites count
songSchema.virtual('favoritesCount').get(function() {
  return this.favorites.length;
});

// ============= INSTANCE METHODS =============

// Transpose chords to a different key
songSchema.methods.transposeChords = function(
  fromKey: string,
  toKey: string
): ISong {
  // Chord transposition logic (simplified - you'd use a library like 'chord-transposer')
  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const fromIndex = keys.indexOf(fromKey);
  const toIndex = keys.indexOf(toKey);
  const steps = toIndex - fromIndex;
  
  // Clone the song and transpose
  const transposed = this.toObject();
  transposed.currentKey = toKey;
  
  // Transpose each chord in sections
  if (transposed.sections) {
    // Replace lines 332-340 with:
transposed.sections.forEach((section: { name: string; lines: IChordLine[] }) => {
    section.lines.forEach((line: IChordLine) => {
      if (line.chords) {
        line.chords.forEach((chordObj: { chord: string; position: number }) => {
          // This is simplified - use a proper chord transposition library
          chordObj.chord = transposeChord(chordObj.chord, steps);
        });
      }
    });
  });
  }
  return transposed as ISong;
};

// Add a comment
songSchema.methods.addComment = async function(
  userId: Types.ObjectId,
  userName: string,
  text: string
): Promise<ISong> {
  this.comments.push({
    user: userId,
    userName,
    text,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return await this.save();
};

// Add or update a rating
songSchema.methods.addRating = async function(
  userId: Types.ObjectId,
  value: number
): Promise<ISong> {
  // Remove existing rating from this user
  this.ratings = this.ratings.filter(
    (rating: IRating) => rating.user.toString() !== userId.toString()
  );
  
  // Add new rating
  this.ratings.push({
    user: userId,
    value,
    createdAt: new Date(),
  });
  
  return await this.save();
};

// Toggle favorite status
songSchema.methods.toggleFavorite = async function(
  userId: Types.ObjectId
): Promise<ISong> {
  const index = this.favorites.findIndex(
    (id: Types.ObjectId) => id.toString() === userId.toString()
  );
  
  if (index > -1) {
    this.favorites.splice(index, 1); // Remove favorite
  } else {
    this.favorites.push(userId); // Add favorite
  }
  
  return await this.save();
};

// ============= STATIC METHODS =============

// Find popular songs
songSchema.statics.findPopular = function(limit = 10) {
  return this.find()
    .sort({ viewCount: -1, 'ratings.value': -1 })
    .limit(limit)
    .populate('createdBy', 'name email');
};

// Search songs
songSchema.statics.search = function(query: string, limit = 20) {
  return this.find(
    { $text: { $search: query } },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .populate('createdBy', 'name email');
};

// ============= HELPER FUNCTIONS =============

// Simple chord transposition (use a library like 'chord-transposer' in production)
function transposeChord(chord: string, steps: number): string {
  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const chordRegex = /^([A-G][#b]?)(.*)/;
  const match = chord.match(chordRegex);
  
  if (!match) return chord;
  
  const [, root, suffix] = match;
  const rootIndex = keys.indexOf(root.replace('b', '#'));
  
  if (rootIndex === -1) return chord;
  
  const newIndex = (rootIndex + steps + 12) % 12;
  return keys[newIndex] + suffix;
}

// ============= MODEL EXPORT =============

// Prevent model overwrite during hot reload
const Song: Model<ISong> =
  mongoose.models.Song || mongoose.model<ISong>("Song", songSchema);

export default Song;