require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Exercise = require('./models/Exercise');
const User = require('./models/User');

const exercises = [
  { name: 'Push-ups', description: 'A classic bodyweight exercise that targets chest, shoulders, and triceps.', targetMuscle: 'Chest', difficulty: 'beginner', type: 'strength', goal: 'all', duration: 10, caloriesBurned: 70, steps: ['Start in a plank position with hands shoulder-width apart', 'Lower your body until your chest nearly touches the floor', 'Push yourself back up to the starting position', 'Keep your core tight and body straight throughout', 'Repeat for desired number of reps'], image: 'https://picsum.photos/seed/pushups/400/300.jpg' },
  { name: 'Squats', description: 'Fundamental lower body exercise targeting quads, glutes, and hamstrings.', targetMuscle: 'Legs', difficulty: 'beginner', type: 'strength', goal: 'all', duration: 15, caloriesBurned: 100, steps: ['Stand with feet shoulder-width apart', 'Extend arms forward for balance', 'Lower your body as if sitting in a chair', 'Keep knees behind toes and back straight', 'Push through heels to return to start', 'Repeat for desired reps'], image: 'https://picsum.photos/seed/squats/400/300.jpg' },
  { name: 'Plank', description: 'An isometric core exercise that strengthens abs, back, and shoulders.', targetMuscle: 'Core', difficulty: 'beginner', type: 'strength', goal: 'all', duration: 5, caloriesBurned: 30, steps: ['Start in a forearm plank position', 'Keep body in a straight line from head to heels', 'Engage core muscles tightly', 'Hold position for 30-60 seconds', 'Breathe steadily throughout'], image: 'https://picsum.photos/seed/plank/400/300.jpg' },
  { name: 'Lunges', description: 'A unilateral leg exercise that improves balance and strengthens lower body.', targetMuscle: 'Legs', difficulty: 'intermediate', type: 'strength', goal: 'all', duration: 15, caloriesBurned: 90, steps: ['Stand tall with feet hip-width apart', 'Step forward with one leg, lowering hips', 'Both knees should bend to about 90 degrees', 'Push through front heel to return to start', 'Alternate legs for desired reps'], image: 'https://picsum.photos/seed/lunges/400/300.jpg' },
  { name: 'Burpees', description: 'A full-body explosive exercise combining strength and cardio.', targetMuscle: 'Full Body', difficulty: 'intermediate', type: 'cardio', goal: 'lose', duration: 10, caloriesBurned: 120, steps: ['Stand with feet shoulder-width apart', 'Drop into a squat position, hands on floor', 'Kick feet back into plank position', 'Perform a push-up (optional)', 'Jump feet back to squat position', 'Explode up into a jump with arms overhead'], image: 'https://picsum.photos/seed/burpees/400/300.jpg' },
  { name: 'Mountain Climbers', description: 'A dynamic exercise that elevates heart rate while working core and legs.', targetMuscle: 'Core', difficulty: 'intermediate', type: 'cardio', goal: 'lose', duration: 10, caloriesBurned: 100, steps: ['Start in a high plank position', 'Drive one knee toward your chest', 'Quickly switch legs, alternating', 'Keep hips level and core engaged', 'Move as fast as you can with good form'], image: 'https://picsum.photos/seed/mountainclimbers/400/300.jpg' },
  { name: 'Jump Squats', description: 'An explosive lower body exercise that builds power and burns calories.', targetMuscle: 'Legs', difficulty: 'advanced', type: 'cardio', goal: 'lose', duration: 12, caloriesBurned: 130, steps: ['Stand with feet shoulder-width apart', 'Lower into a squat position', 'Explode upward, jumping as high as possible', 'Land softly back into squat position', 'Immediately repeat the movement'], image: 'https://picsum.photos/seed/jumpsquats/400/300.jpg' },
  { name: 'Diamond Push-ups', description: 'A push-up variation that emphasizes triceps and inner chest.', targetMuscle: 'Triceps', difficulty: 'advanced', type: 'strength', goal: 'gain', duration: 10, caloriesBurned: 80, steps: ['Start in plank with hands close together under chest', 'Form a diamond shape with index fingers and thumbs', 'Lower body until chest touches hands', 'Push back up to starting position', 'Keep elbows close to body throughout'], image: 'https://picsum.photos/seed/diamondpushups/400/300.jpg' },
  { name: 'Bicycle Crunches', description: 'An effective core exercise targeting obliques and upper abs.', targetMuscle: 'Core', difficulty: 'intermediate', type: 'strength', goal: 'lose', duration: 10, caloriesBurned: 75, steps: ['Lie flat on back with hands behind head', 'Lift legs to tabletop position', 'Bring right elbow to left knee while straightening right leg', 'Alternate sides in a pedaling motion', 'Keep lower back pressed to floor'], image: 'https://picsum.photos/seed/bicyclecrunches/400/300.jpg' },
  { name: 'Jumping Jacks', description: 'A simple cardio exercise that gets the heart rate up quickly.', targetMuscle: 'Full Body', difficulty: 'beginner', type: 'cardio', goal: 'lose', duration: 10, caloriesBurned: 80, steps: ['Stand with feet together and arms at sides', 'Jump while spreading legs wide and raising arms overhead', 'Jump again to return to starting position', 'Continue at a steady pace', 'Maintain a slight bend in knees on landing'], image: 'https://picsum.photos/seed/jumpingjacks/400/300.jpg' },
  { name: 'Wall Sit', description: 'An isometric leg exercise that builds endurance in quads and glutes.', targetMuscle: 'Legs', difficulty: 'beginner', type: 'strength', goal: 'gain', duration: 5, caloriesBurned: 40, steps: ['Stand with back against a wall', 'Slide down until thighs are parallel to floor', 'Keep knees at 90 degrees, shins vertical', 'Hold position for 30-60 seconds', 'Keep back flat against wall throughout'], image: 'https://picsum.photos/seed/wallsit/400/300.jpg' },
  { name: 'High Knees', description: 'A cardio exercise that also works the core and improves coordination.', targetMuscle: 'Full Body', difficulty: 'intermediate', type: 'cardio', goal: 'lose', duration: 10, caloriesBurned: 100, steps: ['Stand with feet hip-width apart', 'Run in place, lifting knees as high as possible', 'Pump arms in running motion', 'Land on balls of feet', 'Maintain an upright posture throughout'], image: 'https://picsum.photos/seed/highknees/400/300.jpg' },
  { name: 'Glute Bridges', description: 'A lower body exercise focusing on glutes and hamstrings.', targetMuscle: 'Glutes', difficulty: 'beginner', type: 'strength', goal: 'gain', duration: 10, caloriesBurned: 50, steps: ['Lie on back with knees bent, feet flat on floor', 'Place arms at sides, palms down', 'Lift hips toward ceiling, squeezing glutes', 'Hold at top for 2 seconds', 'Lower hips back down with control', 'Repeat for desired reps'], image: 'https://picsum.photos/seed/glutebridges/400/300.jpg' },
  { name: 'Tricep Dips', description: 'A bodyweight exercise targeting the back of the arms using a chair or bench.', targetMuscle: 'Triceps', difficulty: 'intermediate', type: 'strength', goal: 'gain', duration: 10, caloriesBurned: 65, steps: ['Sit on edge of a sturdy chair or bench', 'Place hands next to hips, fingers forward', 'Slide hips off the edge, legs extended', 'Lower body by bending elbows to 90 degrees', 'Push back up to start position', 'Keep back close to chair throughout'], image: 'https://picsum.photos/seed/tricepdips/400/300.jpg' },
  { name: 'Yoga Sun Salutation', description: 'A flowing yoga sequence that improves flexibility and mindfulness.', targetMuscle: 'Full Body', difficulty: 'beginner', type: 'flexibility', goal: 'maintain', duration: 15, caloriesBurned: 60, steps: ['Stand tall in Mountain Pose, arms at sides', 'Inhale, reach arms overhead', 'Exhale, fold forward from hips', 'Inhale, halfway lift with flat back', 'Step back into Plank, lower to floor', 'Inhale into Cobra pose', 'Exhale into Downward Dog', 'Step feet forward, rise back up'], image: 'https://picsum.photos/seed/sunsalutation/400/300.jpg' }
];

const seedDB = async () => {
  try {
    await connectDB();
    await Exercise.deleteMany({});
    console.log('Cleared exercises');
    await Exercise.insertMany(exercises);
    console.log('Inserted ' + exercises.length + ' exercises');
    const trainerExists = await User.findOne({ email: 'trainer@fitnesshub.com' });
    if (!trainerExists) {
      const trainer = new User({ name: 'Coach Ram', email: 'trainer@fitnesshub.com', password: 'trainer123', role: 'trainer', age: 35, gender: 'male', weight: 75, height: 178 });
      await trainer.save();
      console.log('Created trainer account: trainer@fitnesshub.com / trainer123');
    } else {
      console.log('Trainer account already exists');
    }
    console.log('\nSeed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDB();
