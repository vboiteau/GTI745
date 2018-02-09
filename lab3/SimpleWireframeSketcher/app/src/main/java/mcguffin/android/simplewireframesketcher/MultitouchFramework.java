
package mcguffin.android.simplewireframesketcher;


//import java.util.List;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Arrays;
import java.lang.Integer;


//import android.content.Context;
//import android.graphics.Matrix;
import android.graphics.Canvas;
//import android.graphics.Rect;
//import android.graphics.Path;
import android.graphics.Color;
import android.graphics.Paint;
import android.view.MotionEvent;
import android.view.View;
import android.app.Activity;
import android.content.res.Resources;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.Bitmap;
import android.view.inputmethod.InputMethodManager;
import android.content.Context;

public class MultitouchFramework extends View {
	
	public static MultitouchFramework instance = null; // singleton

	private int numBitmaps = 0;
	private Bitmap [] bitmaps = null;

	Activity activity = null;

	Paint paint = new Paint();

	GraphicsWrapper gw = new GraphicsWrapper();
	Camera3D camera = new Camera3D();
	private SimpleWireframeSketcher client = null;
	private MultitouchReceiver receiver = null;
	ArrayList< MultitouchCursor > cursors = new ArrayList< MultitouchCursor >();

	public EventLogger logger = new EventLogger();

	OnHoverListener hoverListener;
	OnTouchListener touchListener;

	public void setNumBitmapsToStore( int num ) {
		if ( num <= 0 ) return;
		if ( numBitmaps != num || bitmaps == null ) {
			numBitmaps = num;
			bitmaps = new Bitmap[ num ];
			for ( int i = 0; i < num; ++i )
				bitmaps[i] = null;
		}
	}
	// TODO-3 id to pass is something like R.drawable.filename
	public void loadBitmap( int index, int id ) {
		if ( 0 <= index && index < numBitmaps && activity != null ) {
			Resources resources = activity.getResources();
			Drawable drawable = resources.getDrawable(id);
			Bitmap b = ((BitmapDrawable)drawable).getBitmap();
			bitmaps[index] = b;
			//logger.log("bitmap dims:" + b.getWidth() + ", " + b.getHeight());
		}
	}
	public void drawBitmap( int index, int x, int y ) { // bitmap is drawn with the current alpha
		if ( 0 <= index && index < numBitmaps ) {
			Bitmap b = bitmaps[index];
			//gw.setColor(0, 0, 0, 1.0f);
			//canvas.drawBitmap( b, x, y, paint);
			gw.drawBitmap( b, x, y);
		}
	}

	public void setPreferredWindowSize( int w, int h ) {
		// ignore
	}
	public MultitouchFramework( Activity activity ) {
		super( activity );

		this.instance = this;
		this.activity = activity;

		setFocusable( true );
		setFocusableInTouchMode( true );

		this.setOnHoverListener( getHoverListener() );
		this.setOnTouchListener( getTouchListener() );

		this.setBackgroundColor(Color.WHITE);
		paint.setColor(Color.BLACK);
		paint.setAntiAlias(true);

		client = new SimpleWireframeSketcher(this,gw,camera);
		client.startBackgroundWork();
		receiver = client;
	}

	public static void Assert( boolean expression, String s ) {
		if ( ! expression && Constant.logAssertionErrorsWithDebugMessages )
			instance.logger.log( "Assertion error " + s );
	}

	public void requestRedraw() {
		// invalidate();

		// The simplest thing to do here would be to call invalidate() on ourself directly,
		// however this won't work if the caller is not in the UI thread.
		// Thus, we indirectly cause invalidate() to be called.
		final View view = this;
		activity.runOnUiThread( new Runnable() {
			public void run() {
				view.invalidate();
			}
		});
	}
	
	// TODO-3 TODO-keyboard
	public void showKeyboard( boolean flag ) {
		InputMethodManager im = (InputMethodManager)activity.getSystemService(Context.INPUT_METHOD_SERVICE);
		if ( flag ) im.showSoftInput(this, InputMethodManager.SHOW_FORCED);
		else im.hideSoftInputFromWindow(this.getWindowToken(), 0);
	}
	
	@Override
	protected void onDraw( Canvas canvas ) {
		// The view is constantly redrawn by this method

		gw.set( paint, canvas );
		camera.setViewportDimensions( canvas.getWidth(), canvas.getHeight() );

		//gw.clear( 0.0f, 0.0f, 0.0f );
		//gw.setCoordinateSystemToWorldSpaceUnits();
		//gw.setLineWidth( 1 );
		//gw.setCoordinateSystemToPixels();

		client.draw();

		if ( Constant.displayLogOfDebugMessages && logger.hasMessages() ) {
			logger.draw( gw );
		}
	}
	private OnHoverListener getHoverListener() {
		if ( hoverListener == null ) {
			hoverListener = new OnHoverListener() {
				public boolean onHover( View v, MotionEvent event ) {
					//if ( Constant.logInputEventsWithDebugMessages )
					//	logger.log(event);
					//v.invalidate();
					return touchListener.onTouch(v,event);

					// return true; // indicates we have consumed the event
				}
			};
		}
		return hoverListener;
	}
	private int computeDeviceType( int androidEventToolType ) {
		int deviceType = 0;
		switch ( androidEventToolType ) {
		case MotionEvent.TOOL_TYPE_FINGER :
			deviceType = MultitouchCursor.DT_FINGER;
			break;
		case MotionEvent.TOOL_TYPE_MOUSE :
			deviceType = MultitouchCursor.DT_MOUSE;
			break;
		case MotionEvent.TOOL_TYPE_STYLUS :
			deviceType = MultitouchCursor.DT_STYLUS;
			break;
		case MotionEvent.TOOL_TYPE_ERASER :
			deviceType = MultitouchCursor.DT_STYLUS_ERASER;
			break;
		}
		return deviceType;
	}
	private OnTouchListener getTouchListener() {
		if ( touchListener == null ) {
			touchListener = new OnTouchListener() {

				public boolean onTouch( View v, MotionEvent event ) {

					if ( Constant.logInputEventsWithDebugMessages )
						logger.log(event);
					//logger.log("  framework: "+cursors.size()+" cursors");

					// On both the Wacom Cintiq Companion, and also the Samsung Galaxy Note II,
					// we cannot receive stylus and finger events intermixed.
					// If the stylus is near the screen, the finger events are blocked,
					// as a sort of simple palm rejection.
					//
					// If fingers are already on the screen when the stylus approaches,
					// then on the Note II, we receive a single ACTION_CANCEL event followed by stylus events,
					// and on the Cintiq Companion, we receive multiple ACTION_POINTER_UP/ACTION_UP events
					// (one for each finger) followed by stylus events.
					// On both devices, once the stylus is in range, the fingers already touching
					// are not permitted to generate any more events.


					if ( event.getActionMasked() == MotionEvent.ACTION_CANCEL ) {
						// *all* fingers have been lifted off
						for ( int i = cursors.size()-1; i >= 0; --i ) {
							MultitouchCursor c = cursors.get(i);
							c.update( MultitouchCursor.DS_OUT_OF_RANGE );
							receiver.processEvent( null, c, MultitouchDispatcher.GE_NONE );
							cursors.remove(i);
						}
					}
					else {
						// Every event we receive contains a list of ids of all active pointers.
						// We first check for any cursors we stored previously that are no longer active.
						// To do this, we copy the ids from the event to a temporary array,
						// and compare the ids of our stored cursors with those in the temporary array.
						int[] tempArrayOfIDs = new int[ event.getPointerCount() ];
						for ( int i = 0; i < event.getPointerCount(); ++i ) {
							int deviceType = computeDeviceType(event.getToolType(i));
							int raw_id = event.getPointerId(i);
							tempArrayOfIDs[i] = MultitouchCursor.computeHashedID( deviceType, raw_id );
						}
						Arrays.sort( tempArrayOfIDs ); // sorting allows us to do binary searches
						for ( int i = cursors.size()-1; i >= 0; --i ) {
							MultitouchCursor c = cursors.get(i);
							if ( Arrays.binarySearch( tempArrayOfIDs, c.hashed_id ) < 0 ) {
								// this cursor seems to be gone
								c.update( MultitouchCursor.DS_OUT_OF_RANGE );
								receiver.processEvent( null, c, MultitouchDispatcher.GE_NONE );
								cursors.remove(i);
							}
						}
						// Next, for each pointer id in the event, we check if it's a new id,
						// or if we already have it in our list of cursors.
						for ( int pointerIndex = 0; pointerIndex < event.getPointerCount(); ++pointerIndex ) {
							int deviceType = computeDeviceType(event.getToolType(pointerIndex));
							int raw_id = event.getPointerId(pointerIndex);
							int hashed_id = MultitouchCursor.computeHashedID( deviceType, raw_id );
							// Do we already have this id in our list of cursors ?
							MultitouchCursor existingCursor = null;
							for ( MultitouchCursor c : cursors ) {
								if ( c.hashed_id == hashed_id ) {
									Assert( c.raw_id == raw_id, "c72a468f" );
									existingCursor = c;
									break;
								}
							}
							if ( existingCursor == null ) {
								// a new cursor must be created
								if ( receiver.isDeviceAcceptable(deviceType) ) {
									MultitouchCursor newCursor = new MultitouchCursor(deviceType,raw_id);

									int new_distanceState;
									switch ( event.getActionMasked() ) {
									case MotionEvent.ACTION_HOVER_ENTER :
									case MotionEvent.ACTION_HOVER_MOVE :
										new_distanceState = MultitouchCursor.DS_HOVERING;
										break;
									case MotionEvent.ACTION_DOWN :
									case MotionEvent.ACTION_POINTER_DOWN :
									case MotionEvent.ACTION_MOVE :
										new_distanceState = MultitouchCursor.DS_TOUCHING;
										break;
									case MotionEvent.ACTION_UP :
									case MotionEvent.ACTION_POINTER_UP :
									case MotionEvent.ACTION_HOVER_EXIT : // keep in mind that ACTION_HOVER_EXIT *could* be immediately followed by ACTION_DOWN
									default:
										new_distanceState = MultitouchCursor.DS_OUT_OF_RANGE;
										break;
									}


									int new_x = Math.round( event.getX( pointerIndex ) );
									int new_y = Math.round( event.getY( pointerIndex ) );
									float new_z = 1, new_pressure = 0;
									if ( newCursor.isStylusOrEraser() ) {
										// TODO-2 what about newCursor.button1 and newCursor.button2 ?
										//     You should set them using event.getButtonState()
										new_z = event.getAxisValue( MotionEvent.AXIS_DISTANCE ); // TODO-2 do we need to be normalize ?
										new_pressure = event.getPressure();
										// TODO-2 what about newCursor.elevation and newCursor.azimuth ?
										//     You should set them using event.getOrientation()
									}
									newCursor.update(
										new_distanceState,
										false,
										false,
										new_x,
										new_y,
										new_z,
										new_pressure,
										0,
										0
									);
									cursors.add( newCursor );
									receiver.processEvent( null, newCursor, MultitouchDispatcher.GE_NONE );
								}
							}
							else {
								int new_distanceState = existingCursor.distanceState;
								int new_x = Math.round( event.getX( pointerIndex ) );
								int new_y = Math.round( event.getY( pointerIndex ) );
								boolean isThereNewEventData = false;
								if ( event.getActionIndex() == pointerIndex ) {
									switch ( event.getActionMasked() ) {
									case MotionEvent.ACTION_HOVER_ENTER :
									case MotionEvent.ACTION_HOVER_MOVE :
										new_distanceState = MultitouchCursor.DS_HOVERING;
										break;
									case MotionEvent.ACTION_DOWN :
									case MotionEvent.ACTION_POINTER_DOWN :
									case MotionEvent.ACTION_MOVE :
										new_distanceState = MultitouchCursor.DS_TOUCHING;
										break;
									case MotionEvent.ACTION_UP :
									case MotionEvent.ACTION_POINTER_UP :
									case MotionEvent.ACTION_HOVER_EXIT : // keep in mind that ACTION_HOVER_EXIT *could* be immediately followed by ACTION_DOWN
									default:
										new_distanceState = MultitouchCursor.DS_OUT_OF_RANGE;
										break;
									}
									isThereNewEventData = true;
								}
								else if ( new_x != existingCursor.x || new_y != existingCursor.y ) { // check if x or y have changed
									isThereNewEventData = true;
								}


								if ( isThereNewEventData ) {
									float new_z = 1, new_pressure = 0;
									if ( existingCursor.isStylusOrEraser() ) {
										// TODO-2 what about newCursor.button1 and newCursor.button2 ?
										//     You should set them using event.getButtonState()
										new_z = event.getAxisValue( MotionEvent.AXIS_DISTANCE ); // TODO-2 do we need to be normalize ?
										new_pressure = event.getPressure();
										// TODO-2 what about newCursor.elevation and newCursor.azimuth ?
										//     You should set them using event.getOrientation()
									}
									existingCursor.update(
										new_distanceState,
										false,
										false,
										new_x,
										new_y,
										new_z,
										new_pressure,
										0,
										0
									);
									receiver.processEvent( null, existingCursor, MultitouchDispatcher.GE_NONE );
									if ( existingCursor.isThisCursorBeingLiftedAway() ) {
										cursors.remove( existingCursor );
										Assert( ! cursors.contains( existingCursor ), "3843bfc8" );
									}
								}
							}
						} // for
					}


					v.invalidate(); // TODO-3 this shouldn't be necessary, but will force a redraw

					return true; // indicates we have consumed the event
				}
			};
		}
		return touchListener;
	}

}


