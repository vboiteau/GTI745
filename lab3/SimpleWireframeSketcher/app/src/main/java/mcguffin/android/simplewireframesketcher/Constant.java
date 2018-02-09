
package mcguffin.android.simplewireframesketcher;



public class Constant {
	public static final String PROGRAM_NAME = "Simple Wireframe Sketcher";
	public static final int INITIAL_WINDOW_WIDTH = 1000; // in pixels
	public static final int INITIAL_WINDOW_HEIGHT = 900; // in pixels

	
	// For release code, you might set all of these to false.
	// For normal debugging, you might set the first two to true, to catch assertion errors.
	public static final boolean displayLogOfDebugMessages = true;
	public static final boolean logAssertionErrorsWithDebugMessages = true;
	public static final boolean logInputEventsWithDebugMessages = false;
	public static final boolean logAllOtherDebugMessages = false;

	
	public static float backgroundColorValue = 1.0f; // in [0,1] for [black,white]

	// These are in pixels.
	// TODO-3 these should depend on the screen size
	public static final int TEXT_HEIGHT = 25;
}

