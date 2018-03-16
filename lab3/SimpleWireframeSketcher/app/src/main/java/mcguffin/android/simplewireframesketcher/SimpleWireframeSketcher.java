
package mcguffin.android.simplewireframesketcher;


import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Display;

import java.util.ArrayList;





// This stores a polygonal line, creating by a stroke of the user's finger or pen.
class Stroke {
	// the points that make up the stroke, in world space coordinates
	private ArrayList< Point3D > points = new ArrayList< Point3D >();

	private float color_red = 0;
	private float color_green = 0;
	private float color_blue = 0;
	private float alpha = 1;
	private float stroke = 1;

	public void addPoint( Point3D p ) {
		points.add( p );
	}
	public ArrayList< Point3D > getPoints3D() {
		return points;
	}
	public ArrayList< Point2D > getPoints2D( Camera3D cam ) {
		ArrayList< Point2D > points2D = new ArrayList< Point2D >();
		int [] tmp = new int[2];
		for ( Point3D p : points ) {
			cam.computePixel( p, tmp );
			points2D.add( new Point2D( tmp[0], tmp[1] ) );
		}
		return points2D;
	}

	public void setColor( float r, float g, float b ) {
		color_red = r;
		color_green = g;
		color_blue = b;
	}

	public void setColor(float r, float g, float b, float a){
		color_red = r;
		color_green = g;
		color_blue = b;
		alpha = a;
	}

	public void setStroke(float s){
		stroke = s*15;
	}

	public ArrayList< Point2D > getExpandedConvexHull( Camera3D cam ) {
		ArrayList< Point2D > points2D = getPoints2D( cam );
		ArrayList< Point2D > convexHull = Point2DUtil.computeConvexHull( points2D );
		convexHull = Point2DUtil.computeExpandedPolygon( convexHull, 8 );
		return convexHull;
	}

	public boolean isContainedInRectangle( AlignedRectangle2D r, Camera3D cam ) {
		ArrayList< Point2D > points2D = getPoints2D( cam );
		for ( Point2D p : points2D ) {
			if ( ! r.contains(p) ) return false;
		}
		return true;
	}
	public boolean isContainedInLassoPolygon( ArrayList< Point2D > polygonPoints, Camera3D cam ) {
		ArrayList< Point2D > points2D = getPoints2D( cam );
		for ( Point2D p : points2D ) {
			if ( ! Point2DUtil.isPointInsidePolygon( polygonPoints, p ) )
				return false;
		}
		return true;
	}

	public void draw( GraphicsWrapper gw, Camera3D cam ) {
		gw.setColor( color_red, color_green, color_blue, 1 );
		ArrayList< Point2D > points2D = getPoints2D( cam );
		gw.drawPolyline( points2D , stroke);
	}
}


// This stores a set of strokes.
// Even if there are multiple users interacting with the window at the same time,
// they all interect with a single instance of this class.
class Drawing {

	public ArrayList< Stroke > strokes = new ArrayList< Stroke >();

	public void addStroke( Stroke s ) {
		strokes.add( s );
	}

	public void draw( GraphicsWrapper gw, Camera3D cam ) {
		gw.setLineWidth( 3 );
		for ( Stroke s : strokes ) {
			s.draw( gw, cam );
		}
		gw.setLineWidth( 1 );
	}

}


class DrawingCanvas implements MultitouchReceiver {

	GraphicsWrapper gw = null;
	Camera3D camera = null;
	public Drawing drawing = null;
	Point3D workingOrigin = new Point3D(0,0,0);
	private MultitouchDispatcher parentDispatcher = null;
	public ArrayList< Stroke > selectedStrokes = new ArrayList< Stroke >();

	float currentColor_r = 0, currentColor_g = 0, currentColor_b = 0;

	float pressure = 1;

	// This cursor is provided by the client; we only temporarily store a reference to it.
	MultitouchCursor inputCursor = null;

	public static final int STYLUS_MODE_INKING = 0;
	public static final int STYLUS_MODE_INKING_SYMMETRICAL = 1;
	public static final int STYLUS_MODE_LASSO = 2;
    public static final int ERASE_MODE = 3;
	private int stylusMode = STYLUS_MODE_INKING;
	public int buttonPressed = -1;
	public boolean cameraModeEnabled = true;

	public DrawingCanvas( Drawing d, GraphicsWrapper gw ) {
		drawing = d;
		this.gw = gw;
	}

	public void drawLineSegment3D( Point3D p0, Point3D p1 ) {
		int [] tmp0 = new int[2];
		int [] tmp1 = new int[2];
		camera.computePixel( p0, tmp0 );
		camera.computePixel( p1, tmp1 );
		gw.drawLine( tmp0[0], tmp0[1], tmp1[0], tmp1[1] );
	}
	public void drawPolyline3D( ArrayList< Point3D > points, boolean isClosed ) {
		int [] tmp = new int[2];
		ArrayList< Point2D > points2D = new ArrayList< Point2D >();
		for ( Point3D p : points ) {
			camera.computePixel( p, tmp );
			points2D.add( new Point2D( tmp[0], tmp[1] ) );
		}
		gw.drawPolyline( points2D, isClosed, false );
	}

	public void setColor( float r, float g, float b ) {
		currentColor_r = r;
		currentColor_g = g;
		currentColor_b = b;
	}

	public int getStylusMode() { return stylusMode; }
	public void setStylusMode( int s ) { stylusMode = s; }

	private static boolean doesHistoryOfPositionsLookLikeLassoGesture( MultitouchCursor c ) {
		return c.totalDistanceAlongHistory / (float)c.straightLineDistanceFromStartOfHistory > 2.5f;
	}

	public int maxNumAcceptedCursors() { return 2; }
	public boolean isDeviceAcceptable( int deviceType ) { return true; }
	public boolean draggingCursorsCannotExit() { return true; }

	public boolean isInside( int x, int y ) {
		return y >= Toolbar.iconSize;
	}

	public void processEvent( MultitouchDispatcher dispatcher, MultitouchCursor cursor, int geometryEvent ) {
		parentDispatcher = dispatcher;

		//Camera movement
		if ( cursor.supportsMultipleInstances() && cameraModeEnabled) { // fingers

			if ( cursor.distanceState == MultitouchCursor.DS_TOUCHING && cursor.didPositionChange() ) {
				MultitouchCursor otherCursor = dispatcher.getOtherCursorOfReceiver( this, cursor );
				if ( otherCursor!=null && otherCursor.distanceState != MultitouchCursor.DS_TOUCHING ) {
					// ignore the other cursor
					otherCursor = null;
				}

				if ( otherCursor != null ) {
					updateCameraBimanually( cursor, otherCursor );
				}
				else{
					updateCameraUnimanually( cursor );
				}
			}
		}

		//Actions on the canvas
		else if (cursor.isStylusOrEraser() || (cursor.supportsMultipleInstances() && !cameraModeEnabled)) { // stylus or mouse


			switch ( stylusMode ) {
			case STYLUS_MODE_INKING :
			case STYLUS_MODE_INKING_SYMMETRICAL :

				switch ( cursor.getDistanceStateEventType() ) {
				case MultitouchCursor.EVENT_OUT_OF_RANGE_TO_TOUCHING :
				case MultitouchCursor.EVENT_HOVERING_TO_TOUCHING :
					inputCursor = cursor;
					inputCursor.setSavingOfHistory( true );
					break;
				case MultitouchCursor.EVENT_WHILE_TOUCHING :
					// nothing to do but redraw
					MultitouchFramework.Assert( inputCursor == cursor, "f351ad54" );

					if(cursor.isStylusOrEraser()) {
						pressure = inputCursor.old_pressure;
					}
					else{
						pressure = 0.5f;
					}


					break;
				case MultitouchCursor.EVENT_TOUCHING_TO_OUT_OF_RANGE :
				case MultitouchCursor.EVENT_TOUCHING_TO_HOVERING :

					MultitouchFramework.Assert( inputCursor == cursor, "a03d5271" );
					// Add the newly drawn stroke to the drawing

					// Find the plane on which to project the stroke
					Vector3D backwardVector = camera.getForwardVector().negated();
					int dimension = backwardVector.indexOfGreatestComponent();
					Vector3D normalToWorkingPlane = new Vector3D(0,0,0);
					normalToWorkingPlane.v[dimension] = backwardVector.v[dimension];
					normalToWorkingPlane = normalToWorkingPlane.normalized();
					Plane plane = new Plane( normalToWorkingPlane, workingOrigin );

					Stroke newStroke = new Stroke();
					newStroke.setStroke(pressure);
					Stroke newStroke2 = null; // mirror image
					if ( stylusMode == STYLUS_MODE_INKING_SYMMETRICAL )
						newStroke2 = new Stroke();

					//Draws the points according to the history of points
					for ( Point2D p : inputCursor.getHistoryOfPositions() ) {
						Ray3D ray = camera.computeRay( p.x(), p.y() );
						Point3D intersection = new Point3D();
						if ( plane.intersects( ray, intersection, true ) ) {
							newStroke.addPoint( intersection );
							if ( stylusMode == STYLUS_MODE_INKING_SYMMETRICAL )
								newStroke2.addPoint( new Point3D( - intersection.x(), intersection.y(), intersection.z() ) );
						}
					}



					newStroke.setColor( currentColor_r, currentColor_g, currentColor_b);
					drawing.addStroke( newStroke );
					if ( stylusMode == STYLUS_MODE_INKING_SYMMETRICAL ) {
						newStroke2.setColor( currentColor_r, currentColor_g, currentColor_b);
						newStroke2 .setStroke(pressure);
						drawing.addStroke( newStroke2 );

						//Setup Inverted array of pixels
						inputCursor.setInverseHistoryOfPositions(newStroke2.getPoints2D(camera));

					}

					inputCursor = null;
					break;
				}
				break;
			case STYLUS_MODE_LASSO :
				switch ( cursor.getDistanceStateEventType() ) {
				case MultitouchCursor.EVENT_OUT_OF_RANGE_TO_TOUCHING :
				case MultitouchCursor.EVENT_HOVERING_TO_TOUCHING :
					inputCursor = cursor;
					inputCursor.setSavingOfHistory( true );
					break;
				case MultitouchCursor.EVENT_WHILE_TOUCHING :
					// nothing to do but redraw
					MultitouchFramework.Assert( inputCursor == cursor, "f0debe74" );
					break;
				case MultitouchCursor.EVENT_TOUCHING_TO_OUT_OF_RANGE :
				case MultitouchCursor.EVENT_TOUCHING_TO_HOVERING :
					MultitouchFramework.Assert( inputCursor == cursor, "110da2eb" );
					// Update the selection

					//TODO
					if ( doesHistoryOfPositionsLookLikeLassoGesture( inputCursor ) ) {
						// complete a lasso selection

						boolean done = false;
						for ( Stroke s : drawing.strokes ) {
							ArrayList< Point3D > points3D = s.getPoints3D();
							ArrayList< Point2D > points2D = s.getPoints2D( camera );
							for ( int i = 0; i < points2D.size(); ++i ) {
								if ( Point2DUtil.isPointInsidePolygon( /*lasso*/cursor.getHistoryOfPositions(), points2D.get(i) ) ) {
									workingOrigin.copy( points3D.get(i) );
									done = true;
									break;
								}
								if ( done ) break;
							}
						}
					}
					else {
						// complete a rectangle selection

						boolean done = false;
						AlignedRectangle2D selectedRectangle = new AlignedRectangle2D(
							cursor.getFirstPosition(), cursor.getCurrentPosition()
						);
						for ( Stroke s : drawing.strokes ) {
							ArrayList< Point3D > points3D = s.getPoints3D();
							ArrayList< Point2D > points2D = s.getPoints2D( camera );
							for ( int i = 0; i < points2D.size(); ++i ) {
								if ( selectedRectangle.contains( points2D.get(i) ) ) {
									workingOrigin.copy( points3D.get(i) );
									done = true;
									break;
								}
								if ( done ) break;
							}
						}
					}

					inputCursor = null;
					break;
				}
				break;
            case ERASE_MODE :
                switch ( cursor.getDistanceStateEventType() ) {
                    case MultitouchCursor.EVENT_OUT_OF_RANGE_TO_TOUCHING :
                    case MultitouchCursor.EVENT_HOVERING_TO_TOUCHING :
                        inputCursor = cursor;
                        inputCursor.setSavingOfHistory( true );

                        break;
                    case MultitouchCursor.EVENT_WHILE_TOUCHING :
                        // nothing to do but redraw
                        MultitouchFramework.Assert( inputCursor == cursor, "f351ad54" );

                        pressure = inputCursor.old_pressure;

                        break;
                    case MultitouchCursor.EVENT_TOUCHING_TO_OUT_OF_RANGE :
                    case MultitouchCursor.EVENT_TOUCHING_TO_HOVERING :

                        MultitouchFramework.Assert( inputCursor == cursor, "a03d5271" );
                        // Add the newly drawn stroke to the drawing

                        // Find the plane on which to project the stroke
                        Vector3D backwardVector = camera.getForwardVector().negated();
                        int dimension = backwardVector.indexOfGreatestComponent();
                        Vector3D normalToWorkingPlane = new Vector3D(0,0,0);
                        normalToWorkingPlane.v[dimension] = backwardVector.v[dimension];
                        normalToWorkingPlane = normalToWorkingPlane.normalized();
                        Plane plane = new Plane( normalToWorkingPlane, workingOrigin );

                        Stroke newStroke = new Stroke();
                        newStroke.setStroke(pressure);

                        //Draws the points according to the history of points
                        for ( Point2D p : inputCursor.getHistoryOfPositions() ) {
                            Ray3D ray = camera.computeRay( p.x(), p.y() );
                            Point3D intersection = new Point3D();
                            if ( plane.intersects( ray, intersection, true ) ) {
                                newStroke.addPoint( intersection );
                            }
                        }

                        ArrayList<Stroke> strokesToRemove = new ArrayList<>();
                        ArrayList<Point3D> newP3D = newStroke.getPoints3D();

                        for (int j = 1; j < newP3D.size(); j++) {
                            Point3D newP0 = newP3D.get(j - 1);
                            Point3D newP1 = newP3D.get(j);

                            for ( int i = 0; i < drawing.strokes.size(); i++ ) {
                                Stroke s = drawing.strokes.get(i);
                                ArrayList<Point3D> points3D = s.getPoints3D();

                                for ( int ij = 1; ij < points3D.size(); ++ij ) {
                                    Point3D oldP2 = points3D.get(ij - 1);
                                    Point3D oldP3 = points3D.get(ij);

                                    if (Vector3D.detectedAnIntersection3D(newP0, newP1, oldP2, oldP3)) {
                                        strokesToRemove.add(s);
                                    }
                                }
                            }
                        }

                        for (Stroke s : strokesToRemove) {
                            drawing.strokes.remove(s);
                        }

                        inputCursor = null;
                        break;
                }
                break;
            }
        }
    }

	private void updateCameraUnimanually( MultitouchCursor cursor ) {
		Point2D newP = cursor.getCurrentPosition();
		Point2D oldP = cursor.getPreviousPosition();
		camera.orbit(oldP.x(),oldP.y(),newP.x(),newP.y());
	}
	private void updateCameraBimanually( MultitouchCursor cursorThatMoved, MultitouchCursor cursorThatDidntMove ) {
		Vector2D newV = Point2D.diff( cursorThatMoved.getCurrentPosition(), cursorThatDidntMove.getCurrentPosition() );
		Vector2D oldV = Point2D.diff( cursorThatMoved.getPreviousPosition(), cursorThatDidntMove.getPreviousPosition() );
		float delta_pixels = newV.length() - oldV.length();
		// a positive delta_pixels means the fingers are getting further away from each other,
		// like in a "zoom in" pinch gesture,
		// so we should move the camera forward

		// this should be a little greater than 1.0
		final float magnificationFactorPerPixel = 1.03f;

		float distanceFromTarget = Point3D.diff(camera.target, camera.position).length();

		float new_distanceFromTarget = distanceFromTarget * (float)Math.pow( magnificationFactorPerPixel, - delta_pixels );
		if ( new_distanceFromTarget > 100 ) new_distanceFromTarget = 100; // TODO

		camera.dollyCameraForward( distanceFromTarget - new_distanceFromTarget, false );

	}

	public void delete( boolean onlySelectedStrokes ) {
		if ( onlySelectedStrokes ) {
			for ( Stroke s : selectedStrokes ) {
				drawing.strokes.remove( s );
			}
		}
		else {
			drawing.strokes.clear();
			workingOrigin.copy( new Point3D( 0,0,0 ) );
		}
		selectedStrokes.clear();

	}

	public void draw( GraphicsWrapper gw, Camera3D camera ) {
		this.gw = gw;
		this.camera = camera;

		gw.setCoordinateSystemToPixels();
		gw.enableAlphaBlending();

		// draw axes
		if ( workingOrigin.x()!=0 || workingOrigin.y()!=0 || workingOrigin.z()!=0 ) {
			gw.setColor(1,0,0);
			drawLineSegment3D( new Point3D(0,0,0), new Point3D(1,0,0) );
			gw.setColor(0,1,0);
			drawLineSegment3D( new Point3D(0,0,0), new Point3D(0,1,0) );
			gw.setColor(0,0,1);
			drawLineSegment3D( new Point3D(0,0,0), new Point3D(0,0,1) );
		}

		// draw working origin
		gw.setColor(1,0,0);
		drawLineSegment3D( workingOrigin, Point3D.sum(workingOrigin,new Vector3D(2,0,0)) );
		drawLineSegment3D( workingOrigin, Point3D.sum(workingOrigin,new Vector3D(0,2,0)) );
		drawLineSegment3D( workingOrigin, Point3D.sum(workingOrigin,new Vector3D(0,0,2)) );

		// Find the plane on which to project the stroke
		// TODO this duplicates code from elsewhere
		Vector3D backwardVector = camera.getForwardVector().negated();
		int dimension = backwardVector.indexOfGreatestComponent();
		//Vector3D normalToWorkingPlane = new Vector3D(0,0,0);
		//normalToWorkingPlane.v[dimension] = backwardVector.v[dimension];
		//normalToWorkingPlane = normalToWorkingPlane.normalized();
		Vector3D v1 = new Vector3D();
		v1.v[(dimension+1)%3] = 3;
		Vector3D v2 = new Vector3D();
		v2.v[(dimension+2)%3] = 3;
		// draw working plane
		ArrayList< Point3D > cornersOfWorkingPlane = new ArrayList< Point3D >();
		cornersOfWorkingPlane.add( Point3D.sum(workingOrigin,Vector3D.sum(v1,v2)) );
		cornersOfWorkingPlane.add( Point3D.sum(workingOrigin,Vector3D.diff(v1,v2)) );
		cornersOfWorkingPlane.add( Point3D.diff(workingOrigin,Vector3D.sum(v1,v2)) );
		cornersOfWorkingPlane.add( Point3D.sum(workingOrigin,Vector3D.diff(v2,v1)) );
		drawPolyline3D( cornersOfWorkingPlane, true );

		drawing.draw( gw, camera );

		gw.setColor(1.0f,0.5f,0,0.2f); // transparent orange
		for ( Stroke s : selectedStrokes ) {
			ArrayList< Point2D > convexHull = s.getExpandedConvexHull( camera );
			gw.fillPolygon( convexHull );
		}

		// gw.setCoordinateSystemToPixels();

		// draw crosshairs below the hovering cursors
		if ( parentDispatcher != null ) {
			final int R = 20; // radius of crosshairs
			gw.setColor(0,0,0,0.5f);
			ArrayList< MultitouchCursor > cursors = parentDispatcher.getCursorsOfReceiver( this );
			for ( MultitouchCursor c : cursors ) {
				if ( c.supportsHover() && c.distanceState==MultitouchCursor.DS_HOVERING ) {
					gw.drawLine( c.x - R, c.y, c.x + R, c.y );
					gw.drawLine( c.x, c.y - R, c.x, c.y + R );
				}
			}

		}

		// drawing ink trails (PREVIEW)
		if ( inputCursor != null && inputCursor.distanceState==MultitouchCursor.DS_TOUCHING ) {

			if ( stylusMode == STYLUS_MODE_INKING || stylusMode == STYLUS_MODE_INKING_SYMMETRICAL ) {

				gw.setColor(0, 0, 0);
				gw.drawPolyline( inputCursor.getHistoryOfPositions());

				if ( stylusMode == STYLUS_MODE_INKING_SYMMETRICAL ) {

					//We create a stroke with 3D positions and we convert it to 2D so we get 3D effect for preview
					Vector3D normalToWorkingPlane = new Vector3D(0,0,0);
					normalToWorkingPlane.v[dimension] = backwardVector.v[dimension];
					normalToWorkingPlane = normalToWorkingPlane.normalized();
					Plane plane = new Plane( normalToWorkingPlane, workingOrigin );

					//Temproary stroke
					Stroke tmpStroke = new Stroke();

					//We create 3D points for every 2D points in the history and get the symmetric points
					for ( Point2D p : inputCursor.getHistoryOfPositions() ) {
						Ray3D ray = camera.computeRay( p.x(), p.y() );
						Point3D intersection = new Point3D();
						if ( plane.intersects( ray, intersection, true ) ) {

							if ( stylusMode == STYLUS_MODE_INKING_SYMMETRICAL )
								tmpStroke.addPoint( new Point3D( - intersection.x(), intersection.y(), intersection.z() ) );
						}
					}

					//Converted to 2D
					gw.drawPolyline(tmpStroke.getPoints2D(camera));

				}

			}
			else if ( stylusMode == STYLUS_MODE_LASSO ) {

				if ( doesHistoryOfPositionsLookLikeLassoGesture( inputCursor ) ) {
					// draw filled polygon
					gw.setColor(0,0,0,0.2f);
					gw.fillPolygon( inputCursor.getHistoryOfPositions() );
				}
				else {
					// draw polyline to indicate that a lasso could be started
					gw.setColor(0,0,0);
					gw.drawPolyline( inputCursor.getHistoryOfPositions() );

					// also draw selection rectangle
					gw.setColor(0,0,0,0.2f);
					Vector2D diagonal = Point2D.diff( inputCursor.getCurrentPosition(), inputCursor.getFirstPosition() );
					gw.fillRect( inputCursor.getFirstPosition().x(), inputCursor.getFirstPosition().y(), diagonal.x(), diagonal.y() );
				}
			}
		}


	}

	public void undo(){

		//If there is atleast one stroke
		if( drawing.strokes.size() > 0) {

			drawing.strokes.remove(drawing.strokes.size() - 1);

		}
	}
}



class ToolbarButton implements MultitouchReceiver {
	MultitouchFramework mf = null;
	Toolbar toolbar = null;
	MultitouchDispatcher parentDispatcher = null;
	public int x0,y0,width,height; // geometry of the button, in pixels
	String tooltip; // popped up if the user hovers over the button
	int iconIndex = -1;

	// This icon is optional.
	// If the button has a disabled icon,
	// then the client can toggle the button between two states:
	// enabled, and disabled.
	// Note that "disabled" does not necessarily mean that the button is greyed out
	// or that the user cannot click it (though the client could use it that way).
	// The "disabled" icon is intended to support buttons that can block/unblock finger input,
	// or lock/unlock screen orientation.
	int disabled_iconIndex = -1;
	boolean isEnabled = true;

	// This icon is optional.
	// If the button has a confirmation icon,
	// then the user activates the button in two steps:
	// a first click to open the confirmation box,
	// and a 2nd click to confirm.
	int confirmation_iconIndex = -1;
	boolean isConfirmationBoxOpen = false;

	public ToolbarButton(
		MultitouchFramework mf,
		Toolbar toolbar,
		int x0, int y0, int width, int height, // geometry of the button, in pixels
		String tooltip,
		int iconIndex,
		int disabled_iconIndex, // -1 for none
		int confirmation_iconIndex // -1 for none
	) {
		this.mf = mf;
		this.toolbar = toolbar;
		this.x0 = x0;
		this.y0 = y0;
		this.width = width;
		this.height = height;
		this.tooltip = tooltip;
		this.iconIndex = iconIndex;
		this.disabled_iconIndex = disabled_iconIndex;
		this.confirmation_iconIndex = confirmation_iconIndex;
	}

	public void setEnabled( boolean flag ) { isEnabled = flag; }
	public boolean isEnabled() { return this.isEnabled; }

	private boolean hasConfirmationBox() {
		return confirmation_iconIndex >= 0;
	}

	private boolean isOverButton( int x, int y ) {
		return x0 <= x && x < x0+width && y0 <= y && y < y0+height;
	}
	private boolean isOverConfirmationBox( int x, int y ) {
		return isConfirmationBoxOpen && x0 <= x && x < x0+width && y0+height <= y && y < y0+2*height;
	}

	public int maxNumAcceptedCursors() { return 1; }
	public boolean isDeviceAcceptable( int deviceType ) { return true; }
	public boolean draggingCursorsCannotExit() { return true; }

	public boolean isInside( int x, int y ) {
		return isOverButton(x,y) || isOverConfirmationBox(x,y);
	}

	public void processEvent( MultitouchDispatcher dispatcher, MultitouchCursor cursor, int geometryEvent ) {

		parentDispatcher = dispatcher;

		switch ( cursor.getDistanceStateEventType() ) {
		case MultitouchCursor.EVENT_TOUCHING_TO_OUT_OF_RANGE :
		case MultitouchCursor.EVENT_TOUCHING_TO_HOVERING :
			//Removing this line makes the App always in finger mode without movement of camera
			this.toolbar.setButtonPressed(-1);
			if ( isOverButton( cursor.x, cursor.y ) ) {
				if ( hasConfirmationBox() ) {
					isConfirmationBoxOpen = true;
				}
				else {
					toolbar.buttonCallback( this );
				}
			}
			else {
				if ( isOverConfirmationBox( cursor.x, cursor.y ) ) {
					toolbar.buttonCallback( this );
				}
				isConfirmationBoxOpen = false;
			}
			break;
			case MultitouchCursor.DS_TOUCHING :
				this.toolbar.setButtonPressed(iconIndex);
				break;
		}

	}

	public void draw( GraphicsWrapper gw ) {
		gw.setColor( 1, 1, 1, 1 ); // this is to reset the alpha to 1, otherwise it could affect the bitmap
		mf.drawBitmap( (isEnabled || disabled_iconIndex<0) ? iconIndex : disabled_iconIndex, x0, y0 );

		MultitouchCursor cursor = parentDispatcher!=null ? parentDispatcher.getUniqueCursorOfReceiver( this ) : null;

		if ( cursor!=null && isOverButton( cursor.x, cursor.y ) ) {
			if ( cursor.distanceState == MultitouchCursor.DS_TOUCHING ) {
				gw.setColor( 1, 0, 0, 0.5f );
				gw.fillRect( x0, y0, width, height );
			}
			else if ( cursor.distanceState == MultitouchCursor.DS_HOVERING && ! isConfirmationBoxOpen ) {
				int x_text = (int)( gw.getWidth() - gw.stringWidth( tooltip ) );
				if ( x_text > x0 ) x_text = x0;
				gw.setColor( 0, 0, 0, 1 );
				gw.drawString( x_text, y0+height+gw.getFontHeight(), tooltip );
			}
		}

		if ( isConfirmationBoxOpen ) {
			MultitouchFramework.Assert( hasConfirmationBox(), "8038b65d" );
			gw.setColor( 1, 1, 1, 1 ); // this is to reset the alpha to 1, otherwise it could affect the bitmap
			mf.drawBitmap( confirmation_iconIndex, x0, y0+height );
			if ( cursor!=null && cursor.distanceState == MultitouchCursor.DS_TOUCHING && isOverConfirmationBox( cursor.x, cursor.y ) ) {
				gw.setColor( 1, 0, 0, 0.5f );
				gw.fillRect( x0, y0+height, width, height );
			}
		}
	}
}


class Toolbar implements MultitouchDispatcher, MultitouchReceiver {

	public static final int iconSize = 96; // in pixels

	// These indices will be used to index into an array,
	// and thus should start at zero.
	// The BM_ prefix means BitMap
	private static final int BM_DELETE_SELECTION = 0;
	private static final int BM_DELETE_CONFIRM = 1;
	private static final int BM_RECTANGLE_LASSO_SELECTION_TOOL = 2; // radio button group B
	private static final int BM_INKING_TOOL = 3;                    // radio button group B
	private static final int BM_INKING_SYMMETRICAL_TOOL = 4;        // radio button group B
	private static final int BM_BLACK_INK = 5;   // radio button group C
	private static final int BM_RED_INK = 6;     // radio button group C
	private static final int BM_GREEN_INK = 7;   // radio button group C
	private static final int BM_ORANGE_INK = 8;  // radio button group C
	private static final int BM_BLUE_INK = 9;    // radio button group C
	private static final int BM_PURPLE_INK = 10; // radio button group C
	private static final int BM_GREY_INK = 11;   // radio button group C
	private static final int BM_UNDO = 12;
	private static final int BM_CAMERA = 13;
    private static final int BM_ERASE = 14;
    private static final int NUM_BITMAPS = 15;

	// These indices will be used to index into an array,
	// and thus should start at zero.
	// The TB_ prefix means Toolbar Button
	private static final int TB_DELETE_SELECTION = 0;
	private static final int TB_RECTANGLE_LASSO_SELECTION_TOOL = 1; // radio button group B
	private static final int TB_INKING_TOOL = 2;                    // radio button group B
	private static final int TB_INKING_SYMMETRICAL_TOOL = 3;        // radio button group B
	private static final int TB_BLACK_INK = 4;  // radio button group C
	private static final int TB_RED_INK = 5;    // radio button group C
	private static final int TB_GREEN_INK = 6;  // radio button group C
	private static final int TB_ORANGE_INK = 7; // radio button group C
	private static final int TB_BLUE_INK = 8;   // radio button group C
	private static final int TB_PURPLE_INK = 9; // radio button group C
	private static final int TB_GREY_INK = 10;  // radio button group C
	private static final int TB_UNDO = 11;

	private static final int TB_CAMERA = 12;

    private static final int TB_ERASE = 13;

	private static final int NUM_TOOLBAR_BUTTONS = 14;

	public MultitouchFramework mf = null;
	DrawingCanvas drawingCanvas = null;
	MultitouchDispatcherImplementation dispatcherImplementation = new MultitouchDispatcherImplementation();

	ToolbarButton [] buttons = null;

	private int stylusMode_toolbarButton = TB_INKING_TOOL;
	private int colorMode_toolbarButton = TB_BLACK_INK;
	private boolean cameraModeEnabled = true;



	public Toolbar( MultitouchFramework mf, DrawingCanvas dc ) {
		this.mf = mf;
		this.drawingCanvas = dc;

		mf.setNumBitmapsToStore( NUM_BITMAPS );
		mf.loadBitmap( BM_DELETE_SELECTION,               R.drawable.delete );
		mf.loadBitmap( BM_DELETE_CONFIRM,                 R.drawable.delete_confirm );
		mf.loadBitmap( BM_RECTANGLE_LASSO_SELECTION_TOOL, R.drawable.rect_lasso );
		mf.loadBitmap( BM_INKING_TOOL,                    R.drawable.pencil2 );
		mf.loadBitmap( BM_INKING_SYMMETRICAL_TOOL,        R.drawable.pencil_symmetrical );
		mf.loadBitmap( BM_BLACK_INK,                      R.drawable.color_000000 );
		mf.loadBitmap( BM_RED_INK,                        R.drawable.color_ff0000 );
		mf.loadBitmap( BM_GREEN_INK,                      R.drawable.color_00d000 );
		mf.loadBitmap( BM_ORANGE_INK,                     R.drawable.color_ff8000 );
		mf.loadBitmap( BM_BLUE_INK,                       R.drawable.color_0080ff );
		mf.loadBitmap( BM_PURPLE_INK,                     R.drawable.color_ff00ff );
		mf.loadBitmap( BM_GREY_INK,                       R.drawable.color_808080 );
		mf.loadBitmap( BM_UNDO,               			  R.drawable.undo );
		mf.loadBitmap( BM_CAMERA,               			  R.drawable.camera );
        mf.loadBitmap( BM_ERASE,                          R.drawable.eraser );


		buttons = new ToolbarButton[ NUM_TOOLBAR_BUTTONS ];
		int index = 0;
		int x0 = 0;
		buttons[index++] = new ToolbarButton(mf,this,x0,0,iconSize,iconSize,"Delete Selection",
			BM_DELETE_SELECTION,-1,BM_DELETE_CONFIRM); x0 += iconSize;

		x0 += iconSize;

		buttons[index++] = new ToolbarButton(mf,this,x0,0,iconSize,iconSize,"Rectangle/Lasso Selection",
			BM_RECTANGLE_LASSO_SELECTION_TOOL,-1,-1); x0 += iconSize;
		buttons[index++] = new ToolbarButton(mf,this,x0,0,iconSize,iconSize,"Inking",
			BM_INKING_TOOL,-1,-1); x0 += iconSize;
		buttons[index++] = new ToolbarButton(mf,this,x0,0,iconSize,iconSize,"Symmetrical Inking",
			BM_INKING_SYMMETRICAL_TOOL,-1,-1); x0 += iconSize;

		x0 += iconSize;

		buttons[index++] = new ToolbarButton(mf,this,x0,0,iconSize,iconSize,"Black Ink",
			BM_BLACK_INK,-1,-1); x0 += iconSize;
		buttons[index++] = new ToolbarButton(mf,this,x0,0,iconSize,iconSize,"Red Ink",
			BM_RED_INK,-1,-1); x0 += iconSize;
		buttons[index++] = new ToolbarButton(mf,this,x0,0,iconSize,iconSize,"Green Ink",
			BM_GREEN_INK,-1,-1); x0 += iconSize;
		buttons[index++] = new ToolbarButton(mf,this,x0,0,iconSize,iconSize,"Orange Ink",
			BM_ORANGE_INK,-1,-1); x0 += iconSize;
		buttons[index++] = new ToolbarButton(mf,this,x0,0,iconSize,iconSize,"Blue Ink",
			BM_BLUE_INK,-1,-1); x0 += iconSize;
		buttons[index++] = new ToolbarButton(mf,this,x0,0,iconSize,iconSize,"Purple Ink",
			BM_PURPLE_INK,-1,-1); x0 += iconSize;
		buttons[index++] = new ToolbarButton(mf,this,x0,0,iconSize,iconSize,"Grey Ink",
			BM_GREY_INK,-1,-1); x0 += iconSize;

		x0 += iconSize;

		//UNDO
		buttons[index++] = new ToolbarButton(mf,this,x0,0,iconSize,iconSize,"Undo",
				BM_UNDO,-1,-1); x0 += iconSize;

		buttons[index++] = new ToolbarButton(mf,this,x0,0,iconSize,iconSize,"Camera",
				BM_CAMERA,-1,-1); x0 += iconSize;

        //ERASE
        buttons[index++] = new ToolbarButton(mf,this,x0,0,iconSize,iconSize,"Erase",
                BM_ERASE,-1,-1); x0 += iconSize;


		MultitouchFramework.Assert( index == NUM_TOOLBAR_BUTTONS, "e4ef8900" );

		for ( int i = 0; i < NUM_TOOLBAR_BUTTONS; ++i ) {
			dispatcherImplementation.addReceiver( buttons[i] );
		}
	}

	public void setButtonPressed(int id){
		this.drawingCanvas.buttonPressed = id;
	}

	private void setStylusMode( int toolbarButton ) {
		stylusMode_toolbarButton = toolbarButton;
		switch ( stylusMode_toolbarButton ) {
			case TB_RECTANGLE_LASSO_SELECTION_TOOL :
				drawingCanvas.setStylusMode( DrawingCanvas.STYLUS_MODE_LASSO );
				break;
			case TB_INKING_TOOL :
				drawingCanvas.setStylusMode( DrawingCanvas.STYLUS_MODE_INKING );
				break;
			case TB_INKING_SYMMETRICAL_TOOL :
				drawingCanvas.setStylusMode( DrawingCanvas.STYLUS_MODE_INKING_SYMMETRICAL );
				break;
            case TB_ERASE :
                drawingCanvas.setStylusMode( DrawingCanvas.ERASE_MODE );
                break;
			default:
				MultitouchFramework.Assert( false, "2dba096b" );
		}
	}

	private void setInkColor( int toolbarButton ) {
		colorMode_toolbarButton = toolbarButton;
		switch ( colorMode_toolbarButton ) {
			case TB_BLACK_INK :
				drawingCanvas.setColor(0,0,0);
				break;
			case TB_RED_INK :
				drawingCanvas.setColor(1,0,0);
				break;
			case TB_GREEN_INK :
				drawingCanvas.setColor(0,13.0f*16/255,0); // 00d000
				break;
			case TB_ORANGE_INK :
				drawingCanvas.setColor(1,0.5f,0);
				break;
			case TB_BLUE_INK :
				drawingCanvas.setColor(0,0.5f,1.0f);
				break;
			case TB_PURPLE_INK :
				drawingCanvas.setColor(1,0,1);
				break;
			case TB_GREY_INK :
				drawingCanvas.setColor(0.5f,0.5f,0.5f);
				break;
			default:
				MultitouchFramework.Assert( false, "90c6831a" );
		}
	}

	private int indexOfButtonContaining( int x, int y ) {
		for ( int i = 0; i < NUM_TOOLBAR_BUTTONS; ++i )
			if ( buttons[i].isInside(x,y) )
				return i;
		return -1;
	}

	public int maxNumAcceptedCursors() { return 1; }
	public boolean isDeviceAcceptable( int deviceType ) { return true; }
	public boolean draggingCursorsCannotExit() { return true; }

	public boolean isInside( int x, int y ) {
		return indexOfButtonContaining(x,y) >= 0;
	}

	public void processEvent( MultitouchDispatcher dispatcher, MultitouchCursor cursor, int geometryEvent ) {
		dispatcherImplementation.dispatchToChildReceivers( this, cursor, geometryEvent );
	}

	public ArrayList< MultitouchCursor > getCursorsOfReceiver( MultitouchReceiver childReceiver ) {
		return dispatcherImplementation.getCursorsOfReceiver( childReceiver );
	}
	public MultitouchCursor getUniqueCursorOfReceiver( MultitouchReceiver childReceiver ) {
		return dispatcherImplementation.getUniqueCursorOfReceiver( childReceiver );
	}
	public MultitouchCursor getOtherCursorOfReceiver( MultitouchReceiver childReceiver, MultitouchCursor oneCursor ) {
		return dispatcherImplementation.getOtherCursorOfReceiver( childReceiver, oneCursor );
	}


	public void buttonCallback( ToolbarButton button ) {
		if ( button == buttons[ TB_DELETE_SELECTION ] ) {
			// drawingCanvas.delete(true); TODO
			drawingCanvas.delete(false);
		}
		else if (button == buttons[TB_UNDO]){
			drawingCanvas.undo();
		}
		else if (button == buttons[TB_CAMERA]){
			//Enable / Disable camera according to current state of button
			cameraModeEnabled = !cameraModeEnabled;
			this.drawingCanvas.cameraModeEnabled = cameraModeEnabled;
		}
        else if ( button == buttons[ TB_ERASE ] ) {
            setStylusMode( TB_ERASE );
        }

		else if ( button == buttons[ TB_RECTANGLE_LASSO_SELECTION_TOOL ] ) {
			setStylusMode( TB_RECTANGLE_LASSO_SELECTION_TOOL );
		}
		else if ( button == buttons[ TB_INKING_TOOL ] ) {
			setStylusMode( TB_INKING_TOOL );
		}
		else if ( button == buttons[ TB_INKING_SYMMETRICAL_TOOL ] ) {
			setStylusMode( TB_INKING_SYMMETRICAL_TOOL );
		}
		else if ( button == buttons[ TB_BLACK_INK ] ) {
			setInkColor( TB_BLACK_INK );
			if ( stylusMode_toolbarButton!=TB_INKING_TOOL && stylusMode_toolbarButton!=TB_INKING_SYMMETRICAL_TOOL )
				setStylusMode( TB_INKING_TOOL );
		}
		else if ( button == buttons[ TB_RED_INK ] ) {
			setInkColor( TB_RED_INK );
			if ( stylusMode_toolbarButton!=TB_INKING_TOOL && stylusMode_toolbarButton!=TB_INKING_SYMMETRICAL_TOOL )
				setStylusMode( TB_INKING_TOOL );
		}
		else if ( button == buttons[ TB_GREEN_INK ] ) {
			setInkColor( TB_GREEN_INK );
			if ( stylusMode_toolbarButton!=TB_INKING_TOOL && stylusMode_toolbarButton!=TB_INKING_SYMMETRICAL_TOOL )
				setStylusMode( TB_INKING_TOOL );
		}
		else if ( button == buttons[ TB_ORANGE_INK ] ) {
			setInkColor( TB_ORANGE_INK );
			if ( stylusMode_toolbarButton!=TB_INKING_TOOL && stylusMode_toolbarButton!=TB_INKING_SYMMETRICAL_TOOL )
				setStylusMode( TB_INKING_TOOL );
		}
		else if ( button == buttons[ TB_BLUE_INK ] ) {
			setInkColor( TB_BLUE_INK );
			if ( stylusMode_toolbarButton!=TB_INKING_TOOL && stylusMode_toolbarButton!=TB_INKING_SYMMETRICAL_TOOL )
				setStylusMode( TB_INKING_TOOL );
		}
		else if ( button == buttons[ TB_PURPLE_INK ] ) {
			setInkColor( TB_PURPLE_INK );
			if ( stylusMode_toolbarButton!=TB_INKING_TOOL && stylusMode_toolbarButton!=TB_INKING_SYMMETRICAL_TOOL )
				setStylusMode( TB_INKING_TOOL );
		}
		else if ( button == buttons[ TB_GREY_INK ] ) {
			setInkColor( TB_GREY_INK );
			if ( stylusMode_toolbarButton!=TB_INKING_TOOL && stylusMode_toolbarButton!=TB_INKING_SYMMETRICAL_TOOL )
				setStylusMode( TB_INKING_TOOL );
		}

		else {
			// we should never get here
			MultitouchFramework.Assert( false, "dbc77fd2" );
		}
	}

	private void drawHighlightingForButton( GraphicsWrapper gw, int index ) {
		if ( index < 0 ) return;
		ToolbarButton b = buttons[index];
		gw.drawLine( b.x0, b.y0+b.height, b.x0+b.width, b.y0+b.height );
	}
	public void draw( GraphicsWrapper gw ) {
		for ( int i = 0; i < NUM_TOOLBAR_BUTTONS; ++i )
			buttons[i].draw(gw);
		gw.setColor(1,0,0);
		drawHighlightingForButton( gw, stylusMode_toolbarButton );
		drawHighlightingForButton( gw, colorMode_toolbarButton );

		if(cameraModeEnabled){
			drawHighlightingForButton(gw, TB_CAMERA);
		}


	}
}





public class SimpleWireframeSketcher implements Runnable, MultitouchReceiver, MultitouchDispatcher {

	public MultitouchFramework multitouchFramework = null;
	public GraphicsWrapper gw = null;
	public Camera3D camera = null;
	Drawing drawing = new Drawing();
	DrawingCanvas drawingCanvas = new DrawingCanvas( drawing, gw );
	MultitouchDispatcherImplementation dispatcherImplementation = new MultitouchDispatcherImplementation();

	Toolbar toolbar = null;

	private static final int STATE_NO_CURSORS = 0;
	private static final int STATE_ONE_CURSOR_HOVERING_OVER_TOOLBAR = 1;
	private static final int STATE_ONE_CURSOR_HOVERING_OVER_CANVAS = 2;
	private static final int STATE_ONE_CURSOR_TOUCHING_TOOLBAR = 3;
	private static final int STATE_TOUCHING_CANVAS = 4; // touching with 1 or more cursors
	private static final int STATE_ERROR = 5; // 1 or more cursors exist, but we'll remain in error state until they are all gone
	private int state = STATE_NO_CURSORS;

	Thread thread = null;
	boolean threadSuspended;


	public SimpleWireframeSketcher( MultitouchFramework mf, GraphicsWrapper gw, Camera3D camera ) {
		multitouchFramework = mf;
		this.gw = gw;
		this.camera = camera;
		multitouchFramework.setPreferredWindowSize(Constant.INITIAL_WINDOW_WIDTH,Constant.INITIAL_WINDOW_HEIGHT);

		gw.setFontHeight( Constant.TEXT_HEIGHT );

		// gw.frame( new AlignedRectangle2D( new Point2D(-100,-100), new Point2D(100,100) ), true );

		toolbar = new Toolbar(multitouchFramework,drawingCanvas);

		dispatcherImplementation.addReceiver( toolbar );
		dispatcherImplementation.addReceiver( drawingCanvas );
	}



	// Called by the framework at startup time.
	public void startBackgroundWork() {
		if ( thread == null ) {
			thread = new Thread( this );
			threadSuspended = false;
			thread.start();
		}
		else {
			if ( threadSuspended ) {
				threadSuspended = false;
				synchronized( this ) {
					notify();
				}
			}
		}
	}
	public void stopBackgroundWork() {
		threadSuspended = true;
	}
	public void run() {
		try {
			int sleepIntervalInMilliseconds = 1000;
			while (true) {

				// Here's where the thread does some work
				synchronized( this ) {
					// System.out.println("some background work");
					// ...
				}
				// multitouchFramework.requestRedraw();

				// Now the thread checks to see if it should suspend itself
				if ( threadSuspended ) {
					synchronized( this ) {
						while ( threadSuspended ) {
							wait();
						}
					}
				}
				Thread.sleep( sleepIntervalInMilliseconds );  // interval given in milliseconds
			}
		}
		catch (InterruptedException e) { }
	}

	public synchronized void draw() {
		gw.clear(Constant.backgroundColorValue,Constant.backgroundColorValue,Constant.backgroundColorValue);
		gw.setColor(0,0,0);
		gw.setupForDrawing();

		drawingCanvas.draw( gw, camera );

		gw.setCoordinateSystemToPixels();

		gw.setColor(0,0,0);
		toolbar.draw(gw);



		// Draw some text to indicate the number of fingers touching the user interface.
		// This is useful for debugging.
		/*
		int numCursors = orientationMenu.cursorContainer.getNumCursors();
		if ( numCursors > 0 ) {
			String s = "[" + numCursors + " contacts]";
			gw.setColor(0,0,0);
			gw.setFontHeight( Constant.TEXT_HEIGHT );
			gw.drawString(
				Constant.TEXT_HEIGHT,
				2 * Constant.TEXT_HEIGHT,
				s
			);
		}
		*/


	}



	public int maxNumAcceptedCursors() { return MultitouchReceiver.NO_LIMIT; }
	public boolean isDeviceAcceptable( int deviceType ) { return true; }
	public boolean draggingCursorsCannotExit() { return true; }

	public boolean isInside( int x, int y ) {
		return true;
	}

	public void processEvent( MultitouchDispatcher dispatcher, MultitouchCursor cursor, int geometryEvent ) {
		dispatcherImplementation.dispatchToChildReceivers( this, cursor, geometryEvent );
	}

	public ArrayList< MultitouchCursor > getCursorsOfReceiver( MultitouchReceiver childReceiver ) {
		return dispatcherImplementation.getCursorsOfReceiver( childReceiver );
	}
	public MultitouchCursor getUniqueCursorOfReceiver( MultitouchReceiver childReceiver ) {
		return dispatcherImplementation.getUniqueCursorOfReceiver( childReceiver );
	}
	public MultitouchCursor getOtherCursorOfReceiver( MultitouchReceiver childReceiver, MultitouchCursor oneCursor ) {
		return dispatcherImplementation.getOtherCursorOfReceiver( childReceiver, oneCursor );
	}



}


